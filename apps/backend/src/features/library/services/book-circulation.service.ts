import ExcelJS from "exceljs";
import { db } from "@/db/index.js";
import { and, desc, eq, gte, ilike, inArray, lt, or, SQL } from "drizzle-orm";
import { applyStandardExcelReportTableStyling } from "@/utils/excel-report-styling.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { borrowingTypeModel } from "@repo/db/schemas/models/library/borrowing-type.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { bookReissueModel } from "@repo/db/schemas/models/library/book-reissue.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { staffModel } from "@repo/db/schemas/models/user/staff.model.js";
import { getLibraryEntryExitPreviewByUserId } from "@/features/library/services/library-entry-exit.service.js";

type UserType = "ADMIN" | "STUDENT" | "FACULTY" | "STAFF" | "PARENTS";

export type BookCirculationFilters = {
  page: number;
  limit: number;
  search?: string;
  userType?: UserType;
  status?: "ISSUED" | "OVERDUE" | "REISSUED" | "RETURNED";
  issueDate?: string;
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
  latestReissueReturnTimestamp: Date | null;
};

export type BookCirculationPreviewResult = {
  user: NonNullable<
    Awaited<ReturnType<typeof getLibraryEntryExitPreviewByUserId>>
  >["user"];
  rows: BookCirculationPreviewRow[];
};

export type BookCirculationMetaResult = {
  bookOptions: Array<{
    copyDetailsId: number;
    accessNumber: string | null;
    title: string | null;
    author: string | null;
    publication: string | null;
    frontCover: string | null;
  }>;
  borrowingTypeOptions: Array<{ id: number; name: string }>;
  statusOptions: Array<{ id: number; name: string }>;
};

export type BookCirculationUpsertEntry = {
  id?: number | null;
  copyDetailsId: number;
  borrowingTypeId?: number | null;
  issueTimestamp: Date | string;
  returnTimestamp: Date | string;
  actualReturnTimestamp?: Date | string | null;
};

const toDayBounds = (isoDate: string) => {
  const start = new Date(`${isoDate}T00:00:00.000+05:30`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const buildCirculationFilterConditions = (
  filters: Pick<BookCirculationFilters, "status" | "issueDate">,
): SQL[] => {
  const conditions: SQL[] = [];
  const now = new Date();

  if (filters.issueDate?.trim()) {
    const bounds = toDayBounds(filters.issueDate.trim());
    if (bounds) {
      conditions.push(
        and(
          gte(bookCirculationModel.issueTimestamp, bounds.start),
          lt(bookCirculationModel.issueTimestamp, bounds.end),
        )!,
      );
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
  const userConditions: SQL[] = [];
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
  }
  if (userType) {
    userConditions.push(eq(userModel.type, userType));
  }
  const circulationConditions = buildCirculationFilterConditions(filters);
  const whereCirculations = [...userConditions, ...circulationConditions].length
    ? and(...[...userConditions, ...circulationConditions])
    : undefined;
  const circulationRows = await db
    .select({
      circulationId: bookCirculationModel.id,
      userId: userModel.id,
      userName: userModel.name,
      userType: userModel.type,
      studentUid: studentModel.uid,
      staffUid: staffModel.uid,
      attendanceCode: staffModel.attendanceCode,
      image: userModel.image,
      isReturned: bookCirculationModel.isReturned,
      isReIssued: bookCirculationModel.isReIssued,
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
    .where(whereCirculations)
    .orderBy(desc(bookCirculationModel.id));

  const now = Date.now();
  const aggregateMap = new Map<
    number,
    {
      latestCirculationId: number;
      userName: string | null;
      userType: string | null;
      studentUid: string | null;
      staffUid: string | null;
      attendanceCode: string | null;
      image: string | null;
      issued: number;
      overdue: number;
      returned: number;
      daysLate: number;
      fine: number;
      lastUpdatedAt: Date | null;
    }
  >();
  for (const row of circulationRows) {
    if (row.userId === null || row.circulationId === null) continue;

    if (!aggregateMap.has(row.userId)) {
      aggregateMap.set(row.userId, {
        latestCirculationId: row.circulationId,
        userName: row.userName,
        userType: row.userType,
        studentUid: row.studentUid,
        staffUid: row.staffUid,
        attendanceCode: row.attendanceCode,
        image: row.image,
        issued: 0,
        overdue: 0,
        returned: 0,
        daysLate: 0,
        fine: 0,
        lastUpdatedAt: null,
      });
    }
    const bucket = aggregateMap.get(row.userId)!;
    const dueMs = new Date(row.returnTimestamp).getTime();
    const actualMs = row.actualReturnTimestamp
      ? new Date(row.actualReturnTimestamp).getTime()
      : null;
    if (!bucket.lastUpdatedAt || row.updatedAt > bucket.lastUpdatedAt) {
      bucket.lastUpdatedAt = row.updatedAt;
    }

    // "Recent Books" summary:
    // - returned: all completed circulations
    // - overdue/issued: only pending circulations
    if (row.isReturned) {
      bucket.returned += 1;
    } else if (!Number.isNaN(dueMs) && dueMs < now) {
      bucket.overdue += 1;
    } else {
      bucket.issued += 1;
    }

    if (!row.isReturned) {
      const basisMs = actualMs ?? now;
      if (!Number.isNaN(dueMs) && basisMs > dueMs) {
        bucket.daysLate += Math.floor(
          (basisMs - dueMs) / (1000 * 60 * 60 * 24),
        );
      }
      bucket.fine += Math.max(0, (row.fineAmount ?? 0) - (row.fineWaiver ?? 0));
    }
  }

  // If searched user has no circulation rows, still show them with zero summary.
  if (search?.trim()) {
    const whereUsers = userConditions.length
      ? and(...userConditions)
      : undefined;
    const matchedUsers = await db
      .select({
        userId: userModel.id,
        userName: userModel.name,
        userType: userModel.type,
        studentUid: studentModel.uid,
        staffUid: staffModel.uid,
        attendanceCode: staffModel.attendanceCode,
        image: userModel.image,
      })
      .from(userModel)
      .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
      .leftJoin(staffModel, eq(staffModel.userId, userModel.id))
      .where(whereUsers)
      .orderBy(desc(userModel.id));

    for (const user of matchedUsers) {
      if (aggregateMap.has(user.userId)) continue;
      aggregateMap.set(user.userId, {
        latestCirculationId: 0,
        userName: user.userName,
        userType: user.userType,
        studentUid: user.studentUid,
        staffUid: user.staffUid,
        attendanceCode: user.attendanceCode,
        image: user.image,
        issued: 0,
        overdue: 0,
        returned: 0,
        daysLate: 0,
        fine: 0,
        lastUpdatedAt: null,
      });
    }
  }

  const orderedUsers = Array.from(aggregateMap.entries())
    .sort((a, b) => b[1].latestCirculationId - a[1].latestCirculationId)
    .slice(offset, offset + limit);

  const resultRows: BookCirculationListRow[] = orderedUsers.map(
    ([userId, stats]) => {
      return {
        userId,
        userName: stats.userName,
        userType: stats.userType,
        studentUid: stats.studentUid,
        staffUid: stats.staffUid,
        attendanceCode: stats.attendanceCode,
        image: stats.image,
        recentBooks: {
          issued: stats.issued,
          overdue: stats.overdue,
          returned: stats.returned,
        },
        daysLate: stats.daysLate,
        fine: stats.fine,
        lastUpdatedAt: stats.lastUpdatedAt,
      };
    },
  );

  const total = aggregateMap.size;

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
      accessNumber: copyDetailsModel.accessNumber,
      title: bookModel.title,
      author: bookModel.alternateTitle,
      publication: publisherModel.name,
      frontCover: bookModel.frontCover,
      borrowingType: borrowingTypeModel.name,
      isReturned: bookCirculationModel.isReturned,
      issueTimestamp: bookCirculationModel.issueTimestamp,
      returnTimestamp: bookCirculationModel.returnTimestamp,
      actualReturnTimestamp: bookCirculationModel.actualReturnTimestamp,
      fineAmount: bookCirculationModel.fineAmount,
      fineWaiver: bookCirculationModel.fineWaiver,
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
  for (const item of reissueRows) {
    if (!item.bookCirculationId) continue;
    if (!latestReissueMap.has(item.bookCirculationId)) {
      latestReissueMap.set(item.bookCirculationId, item.returnTimestamp);
    }
  }

  const rows: BookCirculationPreviewRow[] = rowsDb.map((row) => ({
    id: row.id,
    copyDetailsId: row.copyDetailsId,
    borrowingTypeId: row.borrowingTypeId,
    accessNumber: row.accessNumber,
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
    latestReissueReturnTimestamp: latestReissueMap.get(row.id) ?? null,
  }));

  return {
    user: entryExitPreview.user,
    rows,
  };
}

export async function getBookCirculationMeta(): Promise<BookCirculationMetaResult> {
  const [bookOptions, borrowingTypeOptions, statusOptions] = await Promise.all([
    db
      .select({
        copyDetailsId: copyDetailsModel.id,
        accessNumber: copyDetailsModel.accessNumber,
        title: bookModel.title,
        author: bookModel.alternateTitle,
        publication: publisherModel.name,
        frontCover: bookModel.frontCover,
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
      issueTimestamp: bookCirculationModel.issueTimestamp,
      returnTimestamp: bookCirculationModel.returnTimestamp,
    })
    .from(bookCirculationModel)
    .where(eq(bookCirculationModel.id, id))
    .limit(1);
  if (!base) return;

  await db
    .update(bookCirculationModel)
    .set({
      isReturned: true,
      actualReturnTimestamp: new Date(),
      returnedToId: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookCirculationModel.userId, base.userId),
        eq(bookCirculationModel.issueTimestamp, base.issueTimestamp),
        eq(bookCirculationModel.returnTimestamp, base.returnTimestamp),
      ),
    );
}

export async function reissueBookCirculationById(id: number): Promise<void> {
  const [base] = await db
    .select({
      userId: bookCirculationModel.userId,
      issueTimestamp: bookCirculationModel.issueTimestamp,
      returnTimestamp: bookCirculationModel.returnTimestamp,
    })
    .from(bookCirculationModel)
    .where(eq(bookCirculationModel.id, id))
    .limit(1);
  if (!base) return;

  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 7);

  await db
    .update(bookCirculationModel)
    .set({
      isReIssued: true,
      isReturned: false,
      issueTimestamp: now,
      returnTimestamp: due,
      actualReturnTimestamp: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookCirculationModel.userId, base.userId),
        eq(bookCirculationModel.issueTimestamp, base.issueTimestamp),
        eq(bookCirculationModel.returnTimestamp, base.returnTimestamp),
      ),
    );
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

  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 7);

  await db.insert(bookCirculationModel).values({
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
  const prepared = rows
    .map((row) => {
      const issueTimestamp = toValidDate(row.issueTimestamp);
      const returnTimestamp = toValidDate(row.returnTimestamp);
      const actualReturnTimestamp = toValidDate(
        row.actualReturnTimestamp ?? null,
      );
      if (!issueTimestamp || !returnTimestamp) return null;
      if (!row.copyDetailsId || Number.isNaN(row.copyDetailsId)) return null;
      return {
        id: row.id && row.id > 0 ? row.id : null,
        copyDetailsId: row.copyDetailsId,
        borrowingTypeId: row.borrowingTypeId ?? null,
        issueTimestamp,
        returnTimestamp,
        actualReturnTimestamp,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

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
            issuedFromId: bookCirculationModel.issuedFromId,
          })
          .from(bookCirculationModel)
          .where(inArray(bookCirculationModel.id, existingIds))
      : [];
    const existingMap = new Map(existingRows.map((row) => [row.id, row]));

    for (const row of prepared) {
      if (row.id) {
        const existing = existingMap.get(row.id);
        if (!existing || existing.userId !== userId) continue;

        const returnTimestampChanged =
          new Date(existing.returnTimestamp).getTime() !==
          row.returnTimestamp.getTime();
        const reissuedById = actorUserId ?? existing.issuedFromId ?? userId;
        const shouldInsertReissue = returnTimestampChanged;

        await tx
          .update(bookCirculationModel)
          .set({
            copyDetailsId: row.copyDetailsId,
            borrowingTypeId: row.borrowingTypeId,
            issueTimestamp: row.issueTimestamp,
            returnTimestamp: row.returnTimestamp,
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
            returnTimestamp: row.returnTimestamp,
          });
        }
        continue;
      }

      await tx.insert(bookCirculationModel).values({
        copyDetailsId: row.copyDetailsId,
        userId,
        borrowingTypeId: row.borrowingTypeId,
        issueTimestamp: row.issueTimestamp,
        returnTimestamp: row.returnTimestamp,
        actualReturnTimestamp: row.actualReturnTimestamp,
        isReturned: !!row.actualReturnTimestamp,
        isReIssued: false,
        isForcedIssue: false,
        fineAmount: 0,
        fineWaiver: 0,
        issuedFromId: actorUserId ?? userId,
        returnedToId: row.actualReturnTimestamp ? (actorUserId ?? null) : null,
      });
    }
  });
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

export async function exportBookCirculationExcel(
  filters: Omit<BookCirculationFilters, "page" | "limit">,
): Promise<Buffer> {
  const whereConditions: SQL[] = [];
  if (filters.search?.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    whereConditions.push(
      or(
        ilike(userModel.name, searchTerm),
        ilike(studentModel.uid, searchTerm),
        ilike(staffModel.uid, searchTerm),
        ilike(staffModel.attendanceCode, searchTerm),
        ilike(bookModel.title, searchTerm),
        ilike(copyDetailsModel.accessNumber, searchTerm),
      )!,
    );
  }
  if (filters.userType) {
    whereConditions.push(eq(userModel.type, filters.userType));
  }
  whereConditions.push(...buildCirculationFilterConditions(filters));
  const whereClause = whereConditions.length
    ? and(...whereConditions)
    : undefined;

  const rows = await db
    .select({
      circulationId: bookCirculationModel.id,
      userName: userModel.name,
      userType: userModel.type,
      studentUid: studentModel.uid,
      staffUid: staffModel.uid,
      attendanceCode: staffModel.attendanceCode,
      bookTitle: bookModel.title,
      accessNumber: copyDetailsModel.accessNumber,
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
    .where(whereClause)
    .orderBy(desc(bookCirculationModel.id))
    .limit(100_000);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Book Circulation");
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

  for (const row of rows) {
    const state = row.isReturned
      ? "RETURNED"
      : row.isReIssued
        ? "REISSUED"
        : new Date(row.returnTimestamp).getTime() < Date.now()
          ? "OVERDUE"
          : "ISSUED";
    sheet.addRow({
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
  }

  applyStandardExcelReportTableStyling(sheet);
  const result = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(result) ? result : Buffer.from(result);
}
