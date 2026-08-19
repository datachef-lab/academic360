import ExcelJS from "exceljs";
import { db } from "@/db/index.js";
import {
  and,
  count,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import type { Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import {
  styleStreamedBodyRow,
  styleStreamedHeaderRow,
} from "@/utils/excel-report-styling.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { borrowingTypeModel } from "@repo/db/schemas/models/library/borrowing-type.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { bookReissueModel } from "@repo/db/schemas/models/library/book-reissue.model.js";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { staffModel } from "@repo/db/schemas/models/user/staff.model.js";
import { getLibraryEntryExitPreviewByUserId } from "@/features/library/services/library-entry-exit.service.js";
import { resolvePolicyForCirculation } from "@/features/library/services/circulation-policy-resolver.service.js";
import {
  applyFineForCirculation,
  getFineAccrualGoLiveDate,
  type FineApplicationResult,
} from "@/features/library/services/library-fine.service.js";
import { emitLibraryNotification } from "@/features/library/services/library-notifications.service.js";
import { emitLibraryEvent } from "@/features/library/services/library-realtime.service.js";

type UserType = "ADMIN" | "STUDENT" | "FACULTY" | "STAFF" | "PARENTS";

export type BookCirculationFilters = {
  page: number;
  limit: number;
  search?: string;
  userType?: UserType;
  status?: "ISSUED" | "OVERDUE" | "REISSUED" | "RETURNED";
  issueDate?: string;
  branchId?: number;
};

export type BookCirculationListRow = {
  userId: number;
  userName: string | null;
  userType: string | null;
  studentUid: string | null;
  staffUid: string | null;
  attendanceCode: string | null;
  image: string | null;
  recentBooks: {
    issued: number;
    overdue: number;
    returned: number;
  };
  daysLate: number;
  fine: number;
  lastUpdatedAt: Date | null;
};

export type BookCirculationListResult = {
  rows: BookCirculationListRow[];
  total: number;
  page: number;
  limit: number;
};

export type BookCirculationPreviewRow = {
  id: number;
  copyDetailsId: number;
  borrowingTypeId: number | null;
  accessNumber: string | null;
  oldAccessNumber: string | null;
  /** Copy's item category, falling back to the book's (same rule the policy resolver uses). */
  itemCategoryName: string | null;
  title: string | null;
  author: string | null;
  publication: string | null;
  frontCover: string | null;
  borrowingType: string | null;
  status: "ISSUED" | "RETURNED";
  issuedTimestamp: Date;
  returnTimestamp: Date;
  actualReturnTimestamp: Date | null;
  fine: number;
  fineWaiver: number;
  netFine: number;
  finePaid: boolean;
  latestReissueReturnTimestamp: Date | null;
  // Policy facts so the UI can govern actions client-side (server re-enforces).
  reissuesUsed: number;
  renewalLimit: number;
  loanDays: number;
  finePerDay: number;
  maxCopiesAtOnce: number;
};

export type BookCirculationPreviewResult = {
  user: NonNullable<
    Awaited<ReturnType<typeof getLibraryEntryExitPreviewByUserId>>
  >["user"];
  rows: BookCirculationPreviewRow[];
  // Desk gate: circulation actions require a library check-in today.
  hasLibraryEntryToday: boolean;
};

export type BookCirculationMetaResult = {
  bookOptions: Array<{
    copyDetailsId: number;
    accessNumber: string | null;
    oldAccessNumber: string | null;
    title: string | null;
    author: string | null;
    publication: string | null;
    frontCover: string | null;
    // On-loan copies STAY searchable (per desk workflow) but the picker blocks
    // adding them and shows who has the copy and when it is due back.
    onLoan: boolean;
    borrowerName: string | null;
    borrowerDueDate: Date | null;
    itemCategoryName: string | null;
    // False when the copy's current library status disallows issuing it out
    // (e.g. DAMAGE) — the picker disables selecting these.
    isIssuable: boolean;
    statusName: string | null;
  }>;
  borrowingTypeOptions: Array<{ id: number; name: string }>;
  statusOptions: Array<{ id: number; name: string }>;
};

export type BookCirculationUpsertEntry = {
  id?: number | null;
  copyDetailsId: number;
  borrowingTypeId?: number | null;
  issueTimestamp: Date | string;
  // Optional: when omitted the due date is derived server-side from policy.
  returnTimestamp?: Date | string | null;
  actualReturnTimestamp?: Date | string | null;
  // Desk override: bypasses availability / copy-cap / non-circulating policy
  // rejections (never the catalog-level "Not to be issued" flag).
  isForcedIssue?: boolean;
};

// The label/barcode printed on a copy reads prefix + access number + suffix
// (e.g. "T112", "ISC45", "BK17"); the columns store them separately and legacy
// rows use "0"/"" placeholders for an absent prefix/suffix. Search and display
// must both use this composed identity or scanned alphanumeric codes never
// match the bare numeric access_number.
const composedAccessNumber = sql<string | null>`case
  when ${copyDetailsModel.accessNumber} is null then null
  else coalesce(nullif(btrim(${copyDetailsModel.prefix}), '0'), '')
    || ${copyDetailsModel.accessNumber}
    || coalesce(nullif(btrim(${copyDetailsModel.suffix}), '0'), '')
end`;

// Scans/typed codes may carry separators ("T-112", "t 112"); strip to the
// alphanumeric core before matching against the composed identity.
const toAccessSearchCore = (term: string) => term.replace(/[^A-Za-z0-9]/g, "");

// Books carry authors via author_details -> authors (alternate_title is
// populated for only ~30 books); aggregate the names for display.
const bookAuthorNames = sql<string | null>`(
  select string_agg(a.name, ', ' order by ad.id)
  from author_details ad
  join authors a on a.id = ad.author_id_fk
  where ad.book_id_fk = ${bookModel.id}
)`;

const toDayBounds = (isoDate: string) => {
  const start = new Date(`${isoDate}T00:00:00.000+05:30`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// Circulation desk gate: only patrons who are INSIDE the library right now
// (checked in today IST and not yet checked out) may issue/re-issue/return.
async function hasLibraryEntryToday(userId: number): Promise<boolean> {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const bounds = toDayBounds(istNow.toISOString().slice(0, 10));
  if (!bounds) return false;
  const [row] = await db
    .select({ id: libraryEntryExitModel.id })
    .from(libraryEntryExitModel)
    .where(
      and(
        eq(libraryEntryExitModel.userId, userId),
        gte(libraryEntryExitModel.entryTimestamp, bounds.start),
        lt(libraryEntryExitModel.entryTimestamp, bounds.end),
        // "Present" = checked in and not yet checked out.
        isNull(libraryEntryExitModel.exitTimestamp),
      ),
    )
    .limit(1);
  return !!row;
}

async function assertLibraryEntryToday(userId: number): Promise<void> {
  if (await hasLibraryEntryToday(userId)) return;
  throw new ApiError(
    409,
    "No library entry recorded for this patron today — they must check in at the entry gate before books can be issued, re-issued or returned.",
  );
}

const buildCirculationFilterConditions = (
  filters: Pick<BookCirculationFilters, "status" | "issueDate" | "branchId">,
): SQL[] => {
  const conditions: SQL[] = [];
  const now = new Date();

  if (filters.branchId != null) {
    conditions.push(
      or(
        eq(bookCirculationModel.branchId, filters.branchId),
        eq(copyDetailsModel.branchId, filters.branchId),
      )!,
    );
  }

  if (filters.issueDate?.trim()) {
    const bounds = toDayBounds(filters.issueDate.trim());
    if (bounds) {
      const issuedOnDate = and(
        gte(bookCirculationModel.issueTimestamp, bounds.start),
        lt(bookCirculationModel.issueTimestamp, bounds.end),
      )!;
      const returnedOnDate = and(
        gte(bookCirculationModel.actualReturnTimestamp, bounds.start),
        lt(bookCirculationModel.actualReturnTimestamp, bounds.end),
      )!;
      const reissuedOnDate = exists(
        db
          .select({ one: bookReissueModel.id })
          .from(bookReissueModel)
          .where(
            and(
              eq(bookReissueModel.bookCirculationId, bookCirculationModel.id),
              gte(bookReissueModel.createdAt, bounds.start),
              lt(bookReissueModel.createdAt, bounds.end),
            ),
          ),
      );
      conditions.push(or(issuedOnDate, returnedOnDate, reissuedOnDate)!);
    }
  }

  const status = filters.status?.toUpperCase();
  if (status === "ISSUED") {
    conditions.push(eq(bookCirculationModel.isReturned, false));
  } else if (status === "OVERDUE") {
    conditions.push(
      and(
        eq(bookCirculationModel.isReturned, false),
        lt(bookCirculationModel.returnTimestamp, now),
      )!,
    );
  } else if (status === "REISSUED") {
    conditions.push(eq(bookCirculationModel.isReIssued, true));
  } else if (status === "RETURNED") {
    conditions.push(eq(bookCirculationModel.isReturned, true));
  }

  return conditions;
};

export async function findBookCirculationPaginated(
  filters: BookCirculationFilters,
): Promise<BookCirculationListResult> {
  const { page, limit, search, userType } = filters;
  const offset = (page - 1) * limit;
  // `userConditions` must stay user-table-only: it is reused by the
  // "searched user with no circulation rows" fallback query below, which has
  // no copy/book joins. The circulation query gets the wider match that also
  // covers book title + access number (the search box promises both).
  const userConditions: SQL[] = [];
  const circulationUserConditions: SQL[] = [];
  if (search?.trim()) {
    const searchTerm = `%${search.trim()}%`;
    userConditions.push(
      or(
        ilike(userModel.name, searchTerm),
        ilike(studentModel.uid, searchTerm),
        ilike(staffModel.uid, searchTerm),
        ilike(staffModel.attendanceCode, searchTerm),
      )!,
    );
    const accessCore = toAccessSearchCore(search.trim());
    circulationUserConditions.push(
      or(
        ilike(userModel.name, searchTerm),
        ilike(studentModel.uid, searchTerm),
        ilike(staffModel.uid, searchTerm),
        ilike(staffModel.attendanceCode, searchTerm),
        ilike(bookModel.title, searchTerm),
        ...(accessCore ? [ilike(composedAccessNumber, `%${accessCore}%`)] : []),
      )!,
    );
  }
  if (userType) {
    userConditions.push(eq(userModel.type, userType));
    circulationUserConditions.push(eq(userModel.type, userType));
  }
  const circulationConditions = buildCirculationFilterConditions(filters);
  const whereCirculations = [
    ...circulationUserConditions,
    ...circulationConditions,
  ].length
    ? and(...[...circulationUserConditions, ...circulationConditions])
    : undefined;
  // One SQL pass: per-user aggregates + (when searching) zero-stats matched
  // users, ordered and paginated in the database. The previous implementation
  // fetched EVERY matching circulation row (no LIMIT), aggregated into a JS
  // Map and sliced in JS — a full join scan per keystroke, and the biggest
  // single contributor to the 2026-08-19 RDS incident.
  //
  // Semantics preserved exactly from the JS aggregation it replaces:
  // - one row per user; latest_id = max(circulation id) drives the ordering
  // - returned / issued (open) / overdue (open + past due) counts
  // - daysLate + fine summed over OPEN rows only (basis = actual return or now)
  // - lastUpdatedAt = max(updated_at) over all the user's matching rows
  // - searched users with no matching circulations appended with zero stats
  //   (latest_id 0 → they sort last, in user.id desc order)
  const hasSearch = Boolean(search?.trim());
  const aggFilter = whereCirculations
    ? sql`(${whereCirculations}) and ${userModel.id} is not null`
    : sql`${userModel.id} is not null`;
  const extraFilter = hasSearch
    ? sql`(${userConditions.length ? and(...userConditions)! : sql`true`})
        and ${userModel.id} not in (select agg.user_id from agg)`
    : sql`false`;

  const withClause = sql`
    with agg as (
      select
        ${userModel.id} as user_id,
        max(${bookCirculationModel.id}) as latest_id,
        max(${userModel.name}) as user_name,
        max(${userModel.type}) as user_type,
        max(${studentModel.uid}) as student_uid,
        max(${staffModel.uid}) as staff_uid,
        max(${staffModel.attendanceCode}) as attendance_code,
        max(${userModel.image}) as image,
        count(*) filter (where ${bookCirculationModel.isReturned}) as returned,
        count(*) filter (where not ${bookCirculationModel.isReturned}) as issued,
        count(*) filter (
          where not ${bookCirculationModel.isReturned}
            and ${bookCirculationModel.returnTimestamp} is not null
            and ${bookCirculationModel.returnTimestamp} < now()
        ) as overdue,
        coalesce(sum(
          greatest(0, floor(extract(epoch from (
            coalesce(${bookCirculationModel.actualReturnTimestamp}, now())
              - ${bookCirculationModel.returnTimestamp}
          )) / 86400))
        ) filter (
          where not ${bookCirculationModel.isReturned}
            and ${bookCirculationModel.returnTimestamp} is not null
        ), 0) as days_late,
        coalesce(sum(
          greatest(0, coalesce(${bookCirculationModel.fineAmount}, 0)
            - coalesce(${bookCirculationModel.fineWaiver}, 0))
        ) filter (where not ${bookCirculationModel.isReturned}), 0) as fine,
        max(${bookCirculationModel.updatedAt}) as last_updated_at
      from ${bookCirculationModel}
        left join ${userModel} on ${bookCirculationModel.userId} = ${userModel.id}
        left join ${studentModel} on ${studentModel.userId} = ${userModel.id}
        left join ${staffModel} on ${staffModel.userId} = ${userModel.id}
        left join ${copyDetailsModel} on ${bookCirculationModel.copyDetailsId} = ${copyDetailsModel.id}
        left join ${bookModel} on ${copyDetailsModel.bookId} = ${bookModel.id}
      where ${aggFilter}
      group by ${userModel.id}
    ),
    extra as (
      select
        ${userModel.id} as user_id,
        0 as latest_id,
        ${userModel.name} as user_name,
        ${userModel.type} as user_type,
        ${studentModel.uid} as student_uid,
        ${staffModel.uid} as staff_uid,
        ${staffModel.attendanceCode} as attendance_code,
        ${userModel.image} as image,
        0 as returned, 0 as issued, 0 as overdue,
        0 as days_late, 0 as fine,
        null::timestamp as last_updated_at
      from ${userModel}
        left join ${studentModel} on ${studentModel.userId} = ${userModel.id}
        left join ${staffModel} on ${staffModel.userId} = ${userModel.id}
      where ${extraFilter}
    )`;

  const pageResult = await db.execute(sql`
    ${withClause}
    select * from (
      select * from agg
      union all
      select * from extra
    ) t
    order by latest_id desc, user_id desc
    limit ${limit} offset ${offset}`);

  const totalResult = await db.execute(sql`
    ${withClause}
    select (select count(*) from agg) + (select count(*) from extra) as total`);

  type PagedRow = {
    user_id: number;
    user_name: string | null;
    user_type: string | null;
    student_uid: string | null;
    staff_uid: string | null;
    attendance_code: string | null;
    image: string | null;
    issued: string | number;
    overdue: string | number;
    returned: string | number;
    days_late: string | number;
    fine: string | number;
    last_updated_at: Date | string | null;
  };

  const resultRows: BookCirculationListRow[] = (
    pageResult.rows as unknown as PagedRow[]
  ).map((row) => ({
    userId: Number(row.user_id),
    userName: row.user_name,
    userType: row.user_type,
    studentUid: row.student_uid,
    staffUid: row.staff_uid,
    attendanceCode: row.attendance_code,
    image: row.image,
    recentBooks: {
      issued: Number(row.issued),
      overdue: Number(row.overdue),
      returned: Number(row.returned),
    },
    daysLate: Number(row.days_late),
    fine: Number(row.fine),
    lastUpdatedAt: row.last_updated_at ? new Date(row.last_updated_at) : null,
  }));

  const total = Number(
    (totalResult.rows[0] as unknown as { total: string | number })?.total ?? 0,
  );

  return {
    rows: resultRows,
    total,
    page,
    limit,
  };
}

export async function getBookCirculationPreviewByUserId(
  userId: number,
): Promise<BookCirculationPreviewResult | null> {
  const entryExitPreview = await getLibraryEntryExitPreviewByUserId(userId);
  if (!entryExitPreview) return null;

  const rowsDb = await db
    .select({
      id: bookCirculationModel.id,
      copyDetailsId: bookCirculationModel.copyDetailsId,
      borrowingTypeId: bookCirculationModel.borrowingTypeId,
      accessNumber: composedAccessNumber,
      oldAccessNumber: copyDetailsModel.oldAccessNumber,
      itemCategoryName: sql<string | null>`COALESCE(
        (SELECT ic.name FROM library_item_categories ic WHERE ic.id = ${copyDetailsModel.itemCategoryId}),
        (SELECT ic.name FROM library_item_categories ic WHERE ic.id = ${bookModel.itemCategoryId})
      )`,
      title: bookModel.title,
      author: bookAuthorNames,
      publication: publisherModel.name,
      frontCover: bookModel.frontCover,
      borrowingType: borrowingTypeModel.name,
      isReturned: bookCirculationModel.isReturned,
      issueTimestamp: bookCirculationModel.issueTimestamp,
      returnTimestamp: bookCirculationModel.returnTimestamp,
      actualReturnTimestamp: bookCirculationModel.actualReturnTimestamp,
      fineAmount: bookCirculationModel.fineAmount,
      fineWaiver: bookCirculationModel.fineWaiver,
      paymentId: bookCirculationModel.paymentId,
    })
    .from(bookCirculationModel)
    .leftJoin(
      copyDetailsModel,
      eq(bookCirculationModel.copyDetailsId, copyDetailsModel.id),
    )
    .leftJoin(bookModel, eq(copyDetailsModel.bookId, bookModel.id))
    .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id))
    .leftJoin(
      borrowingTypeModel,
      eq(bookCirculationModel.borrowingTypeId, borrowingTypeModel.id),
    )
    .where(eq(bookCirculationModel.userId, userId))
    .orderBy(desc(bookCirculationModel.id));

  const circulationIds = rowsDb.map((row) => row.id);
  const reissueRows = circulationIds.length
    ? await db
        .select({
          bookCirculationId: bookReissueModel.bookCirculationId,
          returnTimestamp: bookReissueModel.returnTimestamp,
          createdAt: bookReissueModel.createdAt,
        })
        .from(bookReissueModel)
        .where(
          or(
            ...circulationIds.map((id) =>
              eq(bookReissueModel.bookCirculationId, id),
            ),
          )!,
        )
        .orderBy(desc(bookReissueModel.createdAt))
    : [];
  const latestReissueMap = new Map<number, Date>();
  const reissueCountMap = new Map<number, number>();
  for (const item of reissueRows) {
    if (!item.bookCirculationId) continue;
    if (!latestReissueMap.has(item.bookCirculationId)) {
      latestReissueMap.set(item.bookCirculationId, item.returnTimestamp);
    }
    reissueCountMap.set(
      item.bookCirculationId,
      (reissueCountMap.get(item.bookCirculationId) ?? 0) + 1,
    );
  }

  // Policy facts per copy so the UI can disable/annotate actions up front
  // (the upsert path re-enforces everything server-side regardless).
  const policyByCopy = new Map<
    number,
    Awaited<ReturnType<typeof resolvePolicyForCirculation>>
  >();
  for (const copyId of new Set(rowsDb.map((r) => r.copyDetailsId))) {
    policyByCopy.set(copyId, await resolvePolicyForCirculation(userId, copyId));
  }

  const rows: BookCirculationPreviewRow[] = rowsDb.map((row) => ({
    id: row.id,
    copyDetailsId: row.copyDetailsId,
    borrowingTypeId: row.borrowingTypeId,
    accessNumber: row.accessNumber,
    oldAccessNumber: row.oldAccessNumber,
    itemCategoryName: row.itemCategoryName,
    title: row.title,
    author: row.author,
    publication: row.publication,
    frontCover: row.frontCover,
    borrowingType: row.borrowingType,
    status: row.isReturned ? "RETURNED" : "ISSUED",
    issuedTimestamp: row.issueTimestamp,
    returnTimestamp: row.returnTimestamp,
    actualReturnTimestamp: row.actualReturnTimestamp,
    fine: row.fineAmount ?? 0,
    fineWaiver: row.fineWaiver ?? 0,
    netFine: (row.fineAmount ?? 0) - (row.fineWaiver ?? 0),
    finePaid: row.paymentId != null,
    latestReissueReturnTimestamp: latestReissueMap.get(row.id) ?? null,
    reissuesUsed: reissueCountMap.get(row.id) ?? 0,
    renewalLimit: policyByCopy.get(row.copyDetailsId)?.renewalLimit ?? 0,
    loanDays: policyByCopy.get(row.copyDetailsId)?.loanDays ?? 7,
    finePerDay: policyByCopy.get(row.copyDetailsId)?.finePerDay ?? 0,
    maxCopiesAtOnce: policyByCopy.get(row.copyDetailsId)?.maxCopiesAtOnce ?? 0,
  }));

  return {
    user: entryExitPreview.user,
    rows,
    hasLibraryEntryToday: await hasLibraryEntryToday(userId),
  };
}

export type BookOptionResult = BookCirculationMetaResult["bookOptions"][number];

/**
 * Availability annotation for the issue picker. A copy is "on loan" when a
 * book_circulation row for it is still open (actualReturnTimestamp IS NULL —
 * covers both fresh issues and reissues). On-loan copies are NOT filtered out:
 * the desk wants to find them and see who holds them; the frontend blocks the
 * Add action and shows the reason instead.
 */
const bookOptionAnnotations = {
  onLoan: sql<boolean>`EXISTS (
    SELECT 1 FROM book_circulation bc
    WHERE bc.copy_details_id_fk = ${copyDetailsModel.id}
      AND bc.actual_return_timestamp IS NULL
  )`,
  borrowerName: sql<string | null>`(
    SELECT u.name FROM book_circulation bc
    JOIN users u ON u.id = bc.user_id_fk
    WHERE bc.copy_details_id_fk = ${copyDetailsModel.id}
      AND bc.actual_return_timestamp IS NULL
    ORDER BY bc.id DESC LIMIT 1
  )`,
  borrowerDueDate: sql<Date | null>`(
    SELECT bc.return_timestamp FROM book_circulation bc
    WHERE bc.copy_details_id_fk = ${copyDetailsModel.id}
      AND bc.actual_return_timestamp IS NULL
    ORDER BY bc.id DESC LIMIT 1
  )`,
  // Copy's own category first, else the book's — mirrors the policy resolver.
  itemCategoryName: sql<string | null>`COALESCE(
    (SELECT ic.name FROM library_item_categories ic WHERE ic.id = ${copyDetailsModel.itemCategoryId}),
    (SELECT ic.name FROM library_item_categories ic WHERE ic.id = ${bookModel.itemCategoryId})
  )`,
  // Whether the copy's current status permits issuing it out at all.
  isIssuable: sql<boolean>`COALESCE(
    (SELECT s.is_issuable FROM library_statuses s WHERE s.id = ${copyDetailsModel.statusId}),
    true
  )`,
  statusName: sql<string | null>`(
    SELECT s.name FROM library_statuses s WHERE s.id = ${copyDetailsModel.statusId}
  )`,
};

export async function searchBookOptions(
  search: string,
  limit: number,
): Promise<BookOptionResult[]> {
  const safeLimit = Math.min(Math.max(limit || 50, 1), 100);
  const trimmed = search.trim();
  const baseQuery = db
    .select({
      copyDetailsId: copyDetailsModel.id,
      accessNumber: composedAccessNumber,
      oldAccessNumber: copyDetailsModel.oldAccessNumber,
      title: bookModel.title,
      author: bookAuthorNames,
      publication: publisherModel.name,
      frontCover: bookModel.frontCover,
      ...bookOptionAnnotations,
    })
    .from(copyDetailsModel)
    .leftJoin(bookModel, eq(copyDetailsModel.bookId, bookModel.id))
    .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id));

  if (trimmed) {
    // Two-phase: resolve candidate copy ids first through the two trigram
    // indexes (an OR spanning copy_details AND books can only BitmapOr on one
    // relation, so it seq-scanned), then annotate only those ≤limit rows —
    // the correlated borrower/on-loan subqueries used to run per MATCHED row
    // across the whole table. This was the 48-97s query of the 2026-08-19
    // incident.
    const term = `%${trimmed}%`;
    // Candidate ids resolved via the trigram indexes: the access branch matches
    // the COMPOSED accession identity (prefix||access_number||suffix) verbatim so
    // the planner uses `copy_details_access_composed_trgm_idx`; the title branch
    // uses `books_title_trgm_idx`. Skip the access branch when the term has no
    // alphanumeric core. Then annotate only these ≤limit rows.
    const accessCore = toAccessSearchCore(trimmed);
    const accessTerm = `%${accessCore}%`;
    const candidates = await db.execute(sql`
      ${accessCore
        ? sql`(select cd.id from ${copyDetailsModel} cd
        where (case
          when cd.access_number is null then null
          else coalesce(nullif(btrim(cd.prefix), '0'), '')
            || cd.access_number
            || coalesce(nullif(btrim(cd.suffix), '0'), '')
        end) ilike ${accessTerm}
        order by cd.id desc limit ${safeLimit})
      union`
        : sql``}
      (select cd.id from ${copyDetailsModel} cd
        join ${bookModel} b on b.id = cd.book_id_fk
        where b.title ilike ${term}
        order by cd.id desc limit ${safeLimit})
      order by id desc limit ${safeLimit}`);
    const ids = (candidates.rows as unknown as { id: number }[]).map((r) =>
      Number(r.id),
    );
    if (ids.length === 0) return [];
    return baseQuery
      .where(inArray(copyDetailsModel.id, ids))
      .orderBy(desc(copyDetailsModel.id));
  }

  return baseQuery.orderBy(desc(copyDetailsModel.id)).limit(safeLimit);
}

export async function getBookCirculationMeta(): Promise<BookCirculationMetaResult> {
  const [bookOptions, borrowingTypeOptions, statusOptions] = await Promise.all([
    db
      .select({
        copyDetailsId: copyDetailsModel.id,
        accessNumber: composedAccessNumber,
        oldAccessNumber: copyDetailsModel.oldAccessNumber,
        title: bookModel.title,
        author: bookAuthorNames,
        publication: publisherModel.name,
        frontCover: bookModel.frontCover,
        ...bookOptionAnnotations,
      })
      .from(copyDetailsModel)
      .leftJoin(bookModel, eq(copyDetailsModel.bookId, bookModel.id))
      .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id))
      .orderBy(desc(copyDetailsModel.id))
      .limit(500),
    db
      .select({ id: borrowingTypeModel.id, name: borrowingTypeModel.name })
      .from(borrowingTypeModel)
      .orderBy(desc(borrowingTypeModel.id)),
    db
      .select({ id: statusModel.id, name: statusModel.name })
      .from(statusModel)
      .orderBy(desc(statusModel.id)),
  ]);

  return {
    bookOptions,
    borrowingTypeOptions,
    statusOptions,
  };
}

export async function returnBookCirculationById(id: number): Promise<void> {
  const [base] = await db
    .select({
      userId: bookCirculationModel.userId,
      copyDetailsId: bookCirculationModel.copyDetailsId,
      issueTimestamp: bookCirculationModel.issueTimestamp,
      returnTimestamp: bookCirculationModel.returnTimestamp,
      isReturned: bookCirculationModel.isReturned,
    })
    .from(bookCirculationModel)
    .where(eq(bookCirculationModel.id, id))
    .limit(1);
  if (!base) return;

  // Double-return guard. Without this, a second click at the counter would
  // recompute `fineAmount` (potentially higher, since the new "actual return"
  // is later than the first one) and stamp a new `actualReturnTimestamp` —
  // both destructive to a completed handover.
  if (base.isReturned) return;

  await assertLibraryEntryToday(base.userId);

  const actualReturn = new Date();
  const goLive = await getFineAccrualGoLiveDate();

  let fineResult: FineApplicationResult | null = null;
  await db.transaction(async (tx) => {
    await tx
      .update(bookCirculationModel)
      .set({
        isReturned: true,
        actualReturnTimestamp: actualReturn,
        returnedToId: null,
        updatedAt: new Date(),
      })
      .where(eq(bookCirculationModel.id, id));
    // Shared calculator: ledger + circulation mirror, paid-fine freeze, go-live
    // clamp — the same math the nightly accrual sweep uses.
    fineResult = await applyFineForCirculation(tx, {
      circulationId: id,
      userId: base.userId,
      copyDetailsId: base.copyDetailsId,
      dueDate: base.returnTimestamp,
      asOf: actualReturn,
      goLive,
    });
  });

  await emitLibraryNotification({
    event: "LIBRARY_RETURN_CONFIRMED",
    userId: base.userId,
    variables: { circulationId: id, returnedAt: actualReturn.toISOString() },
  });
  const finalFine = fineResult as FineApplicationResult | null;
  if (finalFine?.charged) {
    await emitLibraryNotification({
      event: "LIBRARY_FINE_CHARGED",
      userId: base.userId,
      variables: { circulationId: id, fineAmount: finalFine.fineAmount },
    });
  }
  emitLibraryEvent("library:circulation:updated", {
    userId: base.userId,
    detail: { id, action: "returned", fineAmount: finalFine?.fineAmount ?? 0 },
  });
}

export async function reissueBookCirculationById(id: number): Promise<void> {
  const [base] = await db
    .select({
      userId: bookCirculationModel.userId,
      copyDetailsId: bookCirculationModel.copyDetailsId,
      issuedFromId: bookCirculationModel.issuedFromId,
      issueTimestamp: bookCirculationModel.issueTimestamp,
      returnTimestamp: bookCirculationModel.returnTimestamp,
    })
    .from(bookCirculationModel)
    .where(eq(bookCirculationModel.id, id))
    .limit(1);
  if (!base) return;

  await assertLibraryEntryToday(base.userId);

  const policy = await resolvePolicyForCirculation(
    base.userId,
    base.copyDetailsId,
  );

  // Enforce policy.renewalLimit. One row in book_reissues = one prior renewal,
  // so reissuing now would push the count to existingReissues + 1 ≤ renewalLimit.
  const [{ existingReissues }] = await db
    .select({ existingReissues: count() })
    .from(bookReissueModel)
    .where(eq(bookReissueModel.bookCirculationId, id));
  if (existingReissues >= policy.renewalLimit) {
    throw new ApiError(
      400,
      `Renewal limit reached (${policy.renewalLimit}). This book cannot be reissued again.`,
    );
  }

  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + policy.loanDays);

  await db.transaction(async (tx) => {
    await tx
      .update(bookCirculationModel)
      .set({
        isReIssued: true,
        isReturned: false,
        issueTimestamp: now,
        returnTimestamp: due,
        actualReturnTimestamp: null,
        updatedAt: new Date(),
      })
      .where(eq(bookCirculationModel.id, id));
    await tx.insert(bookReissueModel).values({
      bookCirculationId: id,
      reissuedBy: base.issuedFromId,
      returnTimestamp: due,
    });
  });

  await emitLibraryNotification({
    event: "LIBRARY_REISSUE_CONFIRMED",
    userId: base.userId,
    variables: {
      circulationId: id,
      newReturnTimestamp: due.toISOString(),
    },
  });
  emitLibraryEvent("library:circulation:updated", {
    userId: base.userId,
    detail: { id, action: "reissued" },
  });
}

export async function issueBookCirculationFromExistingById(
  id: number,
): Promise<void> {
  const [base] = await db
    .select({
      copyDetailsId: bookCirculationModel.copyDetailsId,
      userId: bookCirculationModel.userId,
      borrowingTypeId: bookCirculationModel.borrowingTypeId,
      issuedFromId: bookCirculationModel.issuedFromId,
    })
    .from(bookCirculationModel)
    .where(eq(bookCirculationModel.id, id))
    .limit(1);
  if (!base) return;

  await assertLibraryEntryToday(base.userId);

  const policy = await resolvePolicyForCirculation(
    base.userId,
    base.copyDetailsId,
  );

  // Same guards as the upsert path (parity): availability, non-circulating
  // policy, and the patron's copy cap.
  const [openConflict] = await db
    .select({ id: bookCirculationModel.id })
    .from(bookCirculationModel)
    .where(
      and(
        eq(bookCirculationModel.copyDetailsId, base.copyDetailsId),
        eq(bookCirculationModel.isReturned, false),
      ),
    )
    .limit(1);
  if (openConflict) {
    throw new ApiError(
      400,
      "This copy is already issued and has not been returned yet.",
    );
  }
  if (policy.loanDays <= 0 || policy.maxCopiesAtOnce <= 0) {
    throw new ApiError(
      400,
      "This copy is non-circulating for this patron category as per policy.",
    );
  }
  const [{ openCount }] = await db
    .select({ openCount: count() })
    .from(bookCirculationModel)
    .where(
      and(
        eq(bookCirculationModel.userId, base.userId),
        eq(bookCirculationModel.isReturned, false),
      ),
    );
  if (openCount >= policy.maxCopiesAtOnce) {
    throw new ApiError(
      400,
      `Copy limit reached: this patron already holds ${openCount} open loans (policy allows ${policy.maxCopiesAtOnce}).`,
    );
  }

  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + policy.loanDays);

  const [inserted] = await db
    .insert(bookCirculationModel)
    .values({
      copyDetailsId: base.copyDetailsId,
      userId: base.userId,
      borrowingTypeId: base.borrowingTypeId,
      issueTimestamp: now,
      returnTimestamp: due,
      actualReturnTimestamp: null,
      isReturned: false,
      isReIssued: false,
      isForcedIssue: false,
      fineAmount: 0,
      fineWaiver: 0,
      issuedFromId: base.issuedFromId,
      returnedToId: null,
    })
    .returning({ id: bookCirculationModel.id });

  await emitLibraryNotification({
    event: "LIBRARY_ISSUE_CONFIRMED",
    userId: base.userId,
    variables: {
      circulationId: inserted?.id ?? null,
      copyDetailsId: base.copyDetailsId,
      returnTimestamp: due.toISOString(),
    },
  });
  emitLibraryEvent("library:circulation:updated", {
    userId: base.userId,
    detail: { id: inserted?.id, action: "issued" },
  });
}

const toValidDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function upsertBookCirculationRowsForUser(
  userId: number,
  rows: BookCirculationUpsertEntry[],
  actorUserId: number | null,
): Promise<void> {
  await assertLibraryEntryToday(userId);

  const prepared = rows
    .map((row) => {
      const issueTimestamp = toValidDate(row.issueTimestamp);
      const returnTimestamp = toValidDate(row.returnTimestamp ?? null);
      const actualReturnTimestamp = toValidDate(
        row.actualReturnTimestamp ?? null,
      );
      if (!issueTimestamp) return null;
      if (!row.copyDetailsId || Number.isNaN(row.copyDetailsId)) return null;
      return {
        id: row.id && row.id > 0 ? row.id : null,
        copyDetailsId: row.copyDetailsId,
        borrowingTypeId: row.borrowingTypeId ?? null,
        issueTimestamp,
        // May be null: the due date is then derived from policy server-side.
        returnTimestamp,
        actualReturnTimestamp,
        isForcedIssue: !!row.isForcedIssue,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const events: Array<
    | { kind: "ISSUE"; circulationId: number; returnTimestamp: Date }
    | { kind: "RETURN"; circulationId: number; returnedAt: Date }
    | { kind: "REISSUE"; circulationId: number; newReturnTimestamp: Date }
    | { kind: "FINE"; circulationId: number; fineAmount: number }
  > = [];

  const goLive = await getFineAccrualGoLiveDate();

  await db.transaction(async (tx) => {
    const existingIds = prepared
      .map((row) => row.id)
      .filter((id): id is number => typeof id === "number");

    const existingRows = existingIds.length
      ? await tx
          .select({
            id: bookCirculationModel.id,
            userId: bookCirculationModel.userId,
            returnTimestamp: bookCirculationModel.returnTimestamp,
            actualReturnTimestamp: bookCirculationModel.actualReturnTimestamp,
            issuedFromId: bookCirculationModel.issuedFromId,
            accessNumber: composedAccessNumber,
          })
          .from(bookCirculationModel)
          .leftJoin(
            copyDetailsModel,
            eq(copyDetailsModel.id, bookCirculationModel.copyDetailsId),
          )
          .where(inArray(bookCirculationModel.id, existingIds))
      : [];
    const existingMap = new Map(existingRows.map((row) => [row.id, row]));

    const newCopyIds = Array.from(
      new Set(
        prepared.filter((row) => !row.id).map((row) => row.copyDetailsId),
      ),
    );
    const copyInfoMap = new Map<
      number,
      {
        branchId: number | null;
        issueType: string | null;
        accessNumber: string | null;
      }
    >();
    const openCopySet = new Set<number>();
    if (newCopyIds.length > 0) {
      const copies = await tx
        .select({
          id: copyDetailsModel.id,
          branchId: copyDetailsModel.branchId,
          issueType: copyDetailsModel.issueType,
          accessNumber: composedAccessNumber,
        })
        .from(copyDetailsModel)
        .where(inArray(copyDetailsModel.id, newCopyIds));
      for (const c of copies)
        copyInfoMap.set(c.id, {
          branchId: c.branchId ?? null,
          issueType: c.issueType ?? null,
          accessNumber: c.accessNumber ?? null,
        });
      // Availability: copies of this batch that are still out with anyone.
      const openRows = await tx
        .select({ copyDetailsId: bookCirculationModel.copyDetailsId })
        .from(bookCirculationModel)
        .where(
          and(
            inArray(bookCirculationModel.copyDetailsId, newCopyIds),
            eq(bookCirculationModel.isReturned, false),
          ),
        );
      for (const r of openRows) openCopySet.add(r.copyDetailsId);
    }

    // Copy cap: the patron's open loans, kept current as this batch inserts.
    const [{ openCount }] = await tx
      .select({ openCount: count() })
      .from(bookCirculationModel)
      .where(
        and(
          eq(bookCirculationModel.userId, userId),
          eq(bookCirculationModel.isReturned, false),
        ),
      );
    let userOpenCount = openCount;

    const policyCache = new Map<
      number,
      Awaited<ReturnType<typeof resolvePolicyForCirculation>>
    >();
    const policyFor = async (copyDetailsId: number) => {
      const cached = policyCache.get(copyDetailsId);
      if (cached) return cached;
      const policy = await resolvePolicyForCirculation(userId, copyDetailsId);
      policyCache.set(copyDetailsId, policy);
      return policy;
    };

    for (const row of prepared) {
      if (row.id) {
        const existing = existingMap.get(row.id);
        if (!existing || existing.userId !== userId) continue;

        const rowLabel = existing.accessNumber
          ? `copy ${existing.accessNumber}`
          : `copy #${row.copyDetailsId}`;
        const targetReturnTimestamp =
          row.returnTimestamp ?? existing.returnTimestamp;
        const returnTimestampChanged =
          new Date(existing.returnTimestamp).getTime() !==
          targetReturnTimestamp.getTime();
        const reissuedById = actorUserId ?? existing.issuedFromId ?? userId;
        const shouldInsertReissue = returnTimestampChanged;
        const becameReturned =
          !existing.actualReturnTimestamp && !!row.actualReturnTimestamp;

        // A due-date change IS a renewal — enforce the policy's renewalLimit
        // exactly like the /:id/action REISSUE path does.
        if (shouldInsertReissue && !becameReturned && !row.isForcedIssue) {
          const policy = await policyFor(row.copyDetailsId);
          const [{ existingReissues }] = await tx
            .select({ existingReissues: count() })
            .from(bookReissueModel)
            .where(eq(bookReissueModel.bookCirculationId, row.id));
          if (existingReissues >= policy.renewalLimit) {
            throw new ApiError(
              400,
              `Renewal limit reached (${policy.renewalLimit}) for ${rowLabel}. The due date cannot be extended again.`,
            );
          }
        }

        await tx
          .update(bookCirculationModel)
          .set({
            copyDetailsId: row.copyDetailsId,
            borrowingTypeId: row.borrowingTypeId,
            issueTimestamp: row.issueTimestamp,
            returnTimestamp: targetReturnTimestamp,
            actualReturnTimestamp: row.actualReturnTimestamp,
            isReturned: !!row.actualReturnTimestamp,
            isReIssued: shouldInsertReissue ? true : undefined,
            returnedToId: row.actualReturnTimestamp
              ? (actorUserId ?? null)
              : null,
            updatedAt: new Date(),
          })
          .where(eq(bookCirculationModel.id, row.id));

        if (shouldInsertReissue) {
          await tx.insert(bookReissueModel).values({
            bookCirculationId: row.id,
            reissuedBy: reissuedById,
            returnTimestamp: targetReturnTimestamp,
          });
          events.push({
            kind: "REISSUE",
            circulationId: row.id,
            newReturnTimestamp: targetReturnTimestamp,
          });
        }
        if (becameReturned && row.actualReturnTimestamp) {
          events.push({
            kind: "RETURN",
            circulationId: row.id,
            returnedAt: row.actualReturnTimestamp,
          });
          const fineResult = await applyFineForCirculation(tx, {
            circulationId: row.id,
            userId,
            copyDetailsId: row.copyDetailsId,
            dueDate: targetReturnTimestamp,
            asOf: row.actualReturnTimestamp,
            goLive,
          });
          if (fineResult.charged) {
            events.push({
              kind: "FINE",
              circulationId: row.id,
              fineAmount: fineResult.fineAmount,
            });
          }
        }
        continue;
      }

      const copy = copyInfoMap.get(row.copyDetailsId);
      const rowLabel = copy?.accessNumber
        ? `copy ${copy.accessNumber}`
        : `copy #${row.copyDetailsId}`;
      const isOpenInsert = !row.actualReturnTimestamp;
      const policy = await policyFor(row.copyDetailsId);

      if (isOpenInsert) {
        // Catalog-level block — a "Not to be issued" copy never circulates,
        // forced issue included (fix the catalog instead).
        if (
          (copy?.issueType ?? "").trim().toLowerCase() === "not to be issued"
        ) {
          throw new ApiError(
            400,
            `${rowLabel} is marked "Not to be issued" and cannot be circulated.`,
          );
        }
        if (!row.isForcedIssue) {
          if (openCopySet.has(row.copyDetailsId)) {
            throw new ApiError(
              400,
              `${rowLabel} is already issued and has not been returned yet.`,
            );
          }
          if (policy.loanDays <= 0 || policy.maxCopiesAtOnce <= 0) {
            throw new ApiError(
              400,
              `${rowLabel} is non-circulating for this patron category as per policy.`,
            );
          }
          if (userOpenCount >= policy.maxCopiesAtOnce) {
            throw new ApiError(
              400,
              `Copy limit reached: this patron already holds ${userOpenCount} open ${userOpenCount === 1 ? "loan" : "loans"} (policy allows ${policy.maxCopiesAtOnce}). Return a book first or use forced issue.`,
            );
          }
        }
      }

      // Server-side due-date default from policy; an explicit staff-picked
      // date always wins (desk reality).
      let dueDate = row.returnTimestamp;
      if (!dueDate) {
        dueDate = new Date(row.issueTimestamp);
        dueDate.setDate(dueDate.getDate() + Math.max(1, policy.loanDays));
      }

      const [inserted] = await tx
        .insert(bookCirculationModel)
        .values({
          copyDetailsId: row.copyDetailsId,
          userId,
          branchId: copy?.branchId ?? null,
          borrowingTypeId: row.borrowingTypeId,
          issueTimestamp: row.issueTimestamp,
          returnTimestamp: dueDate,
          actualReturnTimestamp: row.actualReturnTimestamp,
          isReturned: !!row.actualReturnTimestamp,
          isReIssued: false,
          isForcedIssue: row.isForcedIssue,
          fineAmount: 0,
          fineWaiver: 0,
          issuedFromId: actorUserId ?? userId,
          returnedToId: row.actualReturnTimestamp
            ? (actorUserId ?? null)
            : null,
        })
        .returning({ id: bookCirculationModel.id });
      if (inserted?.id && isOpenInsert) {
        userOpenCount += 1;
        openCopySet.add(row.copyDetailsId);
        events.push({
          kind: "ISSUE",
          circulationId: inserted.id,
          returnTimestamp: dueDate,
        });
      }
      if (inserted?.id && !isOpenInsert && row.actualReturnTimestamp) {
        // Historical backfill entered already-returned: still price any fine
        // (the go-live clamp keeps legacy periods forgiven).
        const fineResult = await applyFineForCirculation(tx, {
          circulationId: inserted.id,
          userId,
          copyDetailsId: row.copyDetailsId,
          dueDate,
          asOf: row.actualReturnTimestamp,
          goLive,
        });
        if (fineResult.charged) {
          events.push({
            kind: "FINE",
            circulationId: inserted.id,
            fineAmount: fineResult.fineAmount,
          });
        }
      }
    }
  });

  for (const ev of events) {
    if (ev.kind === "ISSUE") {
      await emitLibraryNotification({
        event: "LIBRARY_ISSUE_CONFIRMED",
        userId,
        variables: {
          circulationId: ev.circulationId,
          returnTimestamp: ev.returnTimestamp.toISOString(),
        },
      });
    } else if (ev.kind === "RETURN") {
      await emitLibraryNotification({
        event: "LIBRARY_RETURN_CONFIRMED",
        userId,
        variables: {
          circulationId: ev.circulationId,
          returnedAt: ev.returnedAt.toISOString(),
        },
      });
    } else if (ev.kind === "REISSUE") {
      await emitLibraryNotification({
        event: "LIBRARY_REISSUE_CONFIRMED",
        userId,
        variables: {
          circulationId: ev.circulationId,
          newReturnTimestamp: ev.newReturnTimestamp.toISOString(),
        },
      });
    } else if (ev.kind === "FINE") {
      await emitLibraryNotification({
        event: "LIBRARY_FINE_CHARGED",
        userId,
        variables: {
          circulationId: ev.circulationId,
          fineAmount: ev.fineAmount,
        },
      });
    }
  }
}

const formatExcelDateTime = (value: Date | string | null) => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const formatExcelDate = (value: Date | string | null) => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB");
};

/**
 * Streams the book-circulation export directly to `res` in ID-descending
 * keyset chunks instead of pulling the full (up to 100k row) result set
 * into memory. The `.limit(100_000)` cap on total rows is preserved
 * exactly.
 */
export async function exportBookCirculationExcel(
  filters: Omit<BookCirculationFilters, "page" | "limit">,
  res: Response,
): Promise<void> {
  const baseConditions: SQL[] = [];
  if (filters.search?.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    const accessCore = toAccessSearchCore(filters.search.trim());
    baseConditions.push(
      or(
        ilike(userModel.name, searchTerm),
        ilike(studentModel.uid, searchTerm),
        ilike(staffModel.uid, searchTerm),
        ilike(staffModel.attendanceCode, searchTerm),
        ilike(bookModel.title, searchTerm),
        ...(accessCore ? [ilike(composedAccessNumber, `%${accessCore}%`)] : []),
      )!,
    );
  }
  if (filters.userType) {
    baseConditions.push(eq(userModel.type, filters.userType));
  }
  baseConditions.push(...buildCirculationFilterConditions(filters));

  const HARD_CAP = 100_000;
  const CHUNK_SIZE = 2000;

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true,
  });
  const sheet = workbook.addWorksheet("Book Circulation", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Circulation ID", key: "id", width: 14 },
    { header: "User", key: "userName", width: 24 },
    { header: "User type", key: "userType", width: 14 },
    { header: "UID / Staff UID", key: "uid", width: 20 },
    { header: "Attendance code", key: "attendanceCode", width: 18 },
    { header: "Book", key: "bookTitle", width: 34 },
    { header: "Access no.", key: "accessNumber", width: 16 },
    { header: "Author", key: "author", width: 24 },
    { header: "Borrowing type", key: "borrowingType", width: 18 },
    { header: "State", key: "state", width: 14 },
    { header: "Issued at", key: "issuedAt", width: 22 },
    { header: "Return date", key: "returnDate", width: 14 },
    { header: "Returned on", key: "returnedOn", width: 22 },
    { header: "Fine", key: "fine", width: 12 },
    { header: "Updated at", key: "updatedAt", width: 22 },
  ];
  styleStreamedHeaderRow(sheet.getRow(1));
  sheet.getRow(1).commit();

  let lastId: number | null = null;
  let totalFetched = 0;
  for (;;) {
    const remaining = HARD_CAP - totalFetched;
    if (remaining <= 0) break;
    const take = Math.min(CHUNK_SIZE, remaining);

    const chunkConditions = [...baseConditions];
    if (lastId != null) {
      chunkConditions.push(lt(bookCirculationModel.id, lastId));
    }
    const chunkWhere = chunkConditions.length
      ? and(...chunkConditions)
      : undefined;

    const chunk = await db
      .select({
        circulationId: bookCirculationModel.id,
        userName: userModel.name,
        userType: userModel.type,
        studentUid: studentModel.uid,
        staffUid: staffModel.uid,
        attendanceCode: staffModel.attendanceCode,
        bookTitle: bookModel.title,
        accessNumber: composedAccessNumber,
        author: bookModel.alternateTitle,
        borrowingType: borrowingTypeModel.name,
        isReturned: bookCirculationModel.isReturned,
        isReIssued: bookCirculationModel.isReIssued,
        issueTimestamp: bookCirculationModel.issueTimestamp,
        returnTimestamp: bookCirculationModel.returnTimestamp,
        actualReturnTimestamp: bookCirculationModel.actualReturnTimestamp,
        fineAmount: bookCirculationModel.fineAmount,
        fineWaiver: bookCirculationModel.fineWaiver,
        updatedAt: bookCirculationModel.updatedAt,
      })
      .from(bookCirculationModel)
      .leftJoin(userModel, eq(bookCirculationModel.userId, userModel.id))
      .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
      .leftJoin(staffModel, eq(staffModel.userId, userModel.id))
      .leftJoin(
        copyDetailsModel,
        eq(bookCirculationModel.copyDetailsId, copyDetailsModel.id),
      )
      .leftJoin(bookModel, eq(copyDetailsModel.bookId, bookModel.id))
      .leftJoin(
        borrowingTypeModel,
        eq(bookCirculationModel.borrowingTypeId, borrowingTypeModel.id),
      )
      .where(chunkWhere)
      .orderBy(desc(bookCirculationModel.id))
      .limit(take);

    if (chunk.length === 0) break;

    for (const row of chunk) {
      const state = row.isReturned
        ? "RETURNED"
        : row.isReIssued
          ? "REISSUED"
          : new Date(row.returnTimestamp).getTime() < Date.now()
            ? "OVERDUE"
            : "ISSUED";
      const dataRow = sheet.addRow({
        id: row.circulationId,
        userName: row.userName ?? "",
        userType: row.userType ?? "",
        uid: row.studentUid ?? row.staffUid ?? "",
        attendanceCode: row.attendanceCode ?? "",
        bookTitle: row.bookTitle ?? "",
        accessNumber: row.accessNumber ?? "",
        author: row.author ?? "",
        borrowingType: row.borrowingType ?? "",
        state,
        issuedAt: formatExcelDateTime(row.issueTimestamp),
        returnDate: formatExcelDate(row.returnTimestamp),
        returnedOn: formatExcelDateTime(row.actualReturnTimestamp),
        fine: Math.max(0, (row.fineAmount ?? 0) - (row.fineWaiver ?? 0)),
        updatedAt: formatExcelDateTime(row.updatedAt),
      });
      styleStreamedBodyRow(dataRow);
      dataRow.commit();
    }

    totalFetched += chunk.length;
    if (chunk.length < take) break;
    lastId = chunk[chunk.length - 1].circulationId;
  }

  sheet.commit();
  await workbook.commit();
}
