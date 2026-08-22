import { db } from "@/db/index.js";
import { LibraryEntryExit, libraryEntryExitModel } from "@repo/db/schemas";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { staffModel } from "@repo/db/schemas/models/user/staff.model.js";
import { promotionModel } from "@repo/db/schemas/models/batches/promotions.model.js";
import { classModel } from "@repo/db/schemas/models/academics/class.model.js";
import { shiftModel } from "@repo/db/schemas/models/academics/shift.model.js";
import { sectionModel } from "@repo/db/schemas/models/academics/section.model.js";
import { programCourseModel } from "@repo/db/schemas/models/course-design/program-course.model.js";
import { affiliationModel } from "@repo/db/schemas/models/course-design/affiliation.model.js";
import { regulationTypeModel } from "@repo/db/schemas/models/course-design/regulation-type.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { borrowingTypeModel } from "@repo/db/schemas/models/library/borrowing-type.model.js";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  lt,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import ExcelJS from "exceljs";
import type { Response } from "express";
import {
  styleStreamedBodyRow,
  styleStreamedHeaderRow,
} from "@/utils/excel-report-styling.js";

type CreateLibraryEntryExitInput = Omit<LibraryEntryExit, "id">;
type UpdateLibraryEntryExitInput = Partial<Omit<LibraryEntryExit, "id">>;
type UserType = "ADMIN" | "STUDENT" | "FACULTY" | "STAFF" | "PARENTS";
type CurrentStatus = "CHECKED_IN" | "CHECKED_OUT";

type LibraryEntryExitFilters = {
  page: number;
  limit: number;
  search?: string;
  userType?: UserType;
  currentStatus?: CurrentStatus;
  date?: string;
  branchId?: number;
};

export type LibraryEntryExitListRow = LibraryEntryExit & {
  userName: string | null;
  userType: string | null;
  image: string | null;
  studentUid: string | null;
  staffUid: string | null;
  staffAttendanceCode: string | null;
};

export type LibraryEntryExitListResult = {
  rows: LibraryEntryExitListRow[];
  total: number;
  checkedInCount: number;
  checkedOutCount: number;
  page: number;
  limit: number;
};

export type LibraryEntryExitExportFilters = Omit<
  LibraryEntryExitFilters,
  "page" | "limit"
>;

export type LibrarySearchUserRow = {
  userId: number;
  userName: string;
  userType: string;
  uid: string | null;
  image: string | null;
  studentUid: string | null;
};

export type LibrarySearchUsersResult = {
  rows: LibrarySearchUserRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryEntryExitPreviewHeader = {
  userId: number;
  userType: string;
  name: string;
  image: string | null;
  isActive: boolean | null;
  uid: string | null;
  rfid: string | null;
  rollNumber: string | null;
  registrationNumber: string | null;
  classRollNumber: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  staffCode: string | null;
  attendanceCode: string | null;
  classOrSemester: string | null;
  shift: string | null;
  section: string | null;
  programCourse: string | null;
  programCourseShortName: string | null;
  affiliation: string | null;
  affiliationShortName: string | null;
  regulationType: string | null;
  regulationTypeShortName: string | null;
};

export type LibraryEntryExitPreviewCirculationRow = {
  id: number;
  accessNumber: string | null;
  title: string | null;
  author: string | null;
  borrowingType: string | null;
  status: string;
  issuedTimestamp: Date | null;
  approvedReturnTimestamp: Date | null;
  returnTimestamp: Date | null;
  daysLate: number;
};

export type LibraryEntryExitBookCirculationSummary = {
  booksIssued: number;
  booksDueForReturn: number;
  booksReturned: number;
  totalDaysLate: number;
};

export type LibraryEntryExitPreviewResult = {
  user: LibraryEntryExitPreviewHeader;
  circulationRows: LibraryEntryExitPreviewCirculationRow[];
  bookCirculationSummary: LibraryEntryExitBookCirculationSummary;
};

const buildFilterConditions = (
  filters: Omit<LibraryEntryExitFilters, "page" | "limit">,
) => {
  const conditions: SQL[] = [];

  if (filters.search?.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(userModel.name, searchTerm),
        ilike(studentModel.uid, searchTerm),
        ilike(studentModel.rfidNumber, searchTerm),
        ilike(studentModel.registrationNumber, searchTerm),
        ilike(studentModel.rollNumber, searchTerm),
        ilike(staffModel.uid, searchTerm),
        ilike(staffModel.attendanceCode, searchTerm),
        ilike(staffModel.codeNumber, searchTerm),
      )!,
    );
  }

  if (filters.userType) {
    conditions.push(eq(userModel.type, filters.userType));
  }

  if (filters.branchId != null) {
    conditions.push(eq(libraryEntryExitModel.branchId, filters.branchId));
  }

  if (filters.currentStatus) {
    conditions.push(
      eq(libraryEntryExitModel.currentStatus, filters.currentStatus),
    );
  }

  if (filters.date) {
    // Match by IST calendar day. entry_timestamp is stored as IST wall-clock
    // (the pool session tz is Asia/Kolkata), so an ::date cast in that session
    // yields the IST date directly. The previous UTC-midnight boundaries were
    // 5:30 off, which mis-scoped "today" near the day boundary — an early-IST
    // scan could match the previous calendar day and reuse a stale open entry.
    conditions.push(
      sql`${libraryEntryExitModel.entryTimestamp}::date = ${filters.date}::date`,
    );
  }

  return conditions;
};

export async function findAllLibraryEntryExit(): Promise<LibraryEntryExit[]> {
  return db
    .select()
    .from(libraryEntryExitModel)
    .orderBy(desc(libraryEntryExitModel.id));
}

export async function findLibraryEntryExitPaginated(
  filters: LibraryEntryExitFilters,
): Promise<LibraryEntryExitListResult> {
  const { page, limit, search, userType, currentStatus, date } = filters;
  const offset = (page - 1) * limit;
  const conditions = buildFilterConditions({
    search,
    userType,
    currentStatus,
    date,
  });

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: libraryEntryExitModel.id,
      legacyLibraryEntryExitId: libraryEntryExitModel.legacyLibraryEntryExitId,
      userId: libraryEntryExitModel.userId,
      currentStatus: libraryEntryExitModel.currentStatus,
      entryTimestamp: libraryEntryExitModel.entryTimestamp,
      exitTimestamp: libraryEntryExitModel.exitTimestamp,
      userName: userModel.name,
      userType: userModel.type,
      image: userModel.image,
      studentUid: studentModel.uid,
      staffUid: staffModel.uid,
      staffAttendanceCode: staffModel.attendanceCode,
    })
    .from(libraryEntryExitModel)
    .leftJoin(userModel, eq(libraryEntryExitModel.userId, userModel.id))
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .leftJoin(staffModel, eq(staffModel.userId, userModel.id))
    .where(whereClause)
    .orderBy(desc(libraryEntryExitModel.id))
    .limit(limit)
    .offset(offset);

  // Single pass for all three totals: the previous three identical-join count
  // queries tripled the scan cost of every list-page load. FILTER preserves
  // the exact per-status semantics of the separate queries.
  const [counters] = await db
    .select({
      total: count(),
      checkedIn: sql<number>`count(*) filter (where ${libraryEntryExitModel.currentStatus} = 'CHECKED_IN')`,
      checkedOut: sql<number>`count(*) filter (where ${libraryEntryExitModel.currentStatus} = 'CHECKED_OUT')`,
    })
    .from(libraryEntryExitModel)
    .leftJoin(userModel, eq(libraryEntryExitModel.userId, userModel.id))
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .leftJoin(staffModel, eq(staffModel.userId, userModel.id))
    .where(whereClause);
  const total = counters?.total ?? 0;
  const checkedInCounter = { total: Number(counters?.checkedIn ?? 0) };
  const checkedOutCounter = { total: Number(counters?.checkedOut ?? 0) };

  return {
    rows,
    total,
    checkedInCount: checkedInCounter?.total ?? 0,
    checkedOutCount: checkedOutCounter?.total ?? 0,
    page,
    limit,
  };
}

/**
 * Batch version of the `user` half of `getLibraryEntryExitPreviewByUserId`
 * — the export only ever reads `preview.user` fields (never
 * `circulationRows` / `bookCirculationSummary`), so this skips the
 * per-user circulation query entirely on top of batching the two lookups
 * that matter. Same field set (incl. the program-course/affiliation/
 * regulation-type SHORT names) so the export stays byte-identical; this is
 * why it's a bespoke batch helper rather than the more generic
 * `enrichUsersForReport` in report-common/enrich-users.ts, which doesn't
 * carry the short-name columns this export's fallback (`shortName ||
 * fullName`) depends on.
 */
export async function getLibraryEntryExitPreviewHeadersByUserIds(
  userIds: number[],
): Promise<Map<number, LibraryEntryExitPreviewHeader>> {
  const out = new Map<number, LibraryEntryExitPreviewHeader>();
  const uniqueIds = Array.from(
    new Set(userIds.filter((n) => Number.isFinite(n))),
  );
  if (uniqueIds.length === 0) return out;

  const baseUsers = await db
    .select({
      userId: userModel.id,
      userType: userModel.type,
      name: userModel.name,
      image: userModel.image,
      isActive: userModel.isActive,
      email: userModel.email,
      phone: userModel.phone,
      whatsapp: userModel.whatsappNumber,
      studentId: studentModel.id,
      studentUid: studentModel.uid,
      studentRfid: studentModel.rfidNumber,
      rollNumber: studentModel.rollNumber,
      registrationNumber: studentModel.registrationNumber,
      classRollNumber: studentModel.classRollNumber,
      staffUid: staffModel.uid,
      staffRfid: staffModel.rfidNumber,
      staffCode: staffModel.codeNumber,
      attendanceCode: staffModel.attendanceCode,
    })
    .from(userModel)
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .leftJoin(staffModel, eq(staffModel.userId, userModel.id))
    .where(inArray(userModel.id, uniqueIds));

  const studentIds = baseUsers
    .map((r) => r.studentId)
    .filter((id): id is number => id != null);

  const promotionRows =
    studentIds.length === 0
      ? []
      : await db
          .select({
            studentId: promotionModel.studentId,
            className: classModel.name,
            shiftName: shiftModel.name,
            sectionName: sectionModel.name,
            programCourseName: programCourseModel.name,
            programCourseShortName: programCourseModel.shortName,
            affiliationName: affiliationModel.name,
            affiliationShortName: affiliationModel.shortName,
            regulationTypeName: regulationTypeModel.name,
            regulationTypeShortName: regulationTypeModel.shortName,
          })
          .from(promotionModel)
          .leftJoin(classModel, eq(promotionModel.classId, classModel.id))
          .leftJoin(shiftModel, eq(promotionModel.shiftId, shiftModel.id))
          .leftJoin(sectionModel, eq(promotionModel.sectionId, sectionModel.id))
          .leftJoin(
            programCourseModel,
            eq(promotionModel.programCourseId, programCourseModel.id),
          )
          .leftJoin(
            affiliationModel,
            eq(programCourseModel.affiliationId, affiliationModel.id),
          )
          .leftJoin(
            regulationTypeModel,
            eq(programCourseModel.regulationTypeId, regulationTypeModel.id),
          )
          .where(inArray(promotionModel.studentId, studentIds))
          .orderBy(desc(promotionModel.id));

  // Keep the FIRST promotion seen per student — rows come back ordered by
  // id DESC, so first = latest, matching the single-user helper's
  // `orderBy(desc(promotionModel.id)).limit(1)`.
  const promoByStudent = new Map<number, (typeof promotionRows)[number]>();
  for (const r of promotionRows) {
    if (r.studentId == null) continue;
    if (!promoByStudent.has(r.studentId)) promoByStudent.set(r.studentId, r);
  }

  // Staff shift — only for staff users with no student record, mirroring the
  // single-user helper's `else if (userType === "STAFF")` branch.
  const staffUserIds = baseUsers
    .filter((r) => r.studentId == null && r.userType === "STAFF")
    .map((r) => r.userId);
  const staffShiftByUser = new Map<number, string | null>();
  if (staffUserIds.length > 0) {
    const rows = await db
      .select({ userId: staffModel.userId, shiftName: shiftModel.name })
      .from(staffModel)
      .leftJoin(shiftModel, eq(staffModel.shiftId, shiftModel.id))
      .where(inArray(staffModel.userId, staffUserIds));
    for (const r of rows) {
      if (r.userId != null) staffShiftByUser.set(r.userId, r.shiftName);
    }
  }

  for (const r of baseUsers) {
    const promo =
      r.studentId != null ? promoByStudent.get(r.studentId) : undefined;
    const shift =
      promo?.shiftName ??
      (r.studentId == null && r.userType === "STAFF"
        ? (staffShiftByUser.get(r.userId) ?? null)
        : null);
    out.set(r.userId, {
      userId: r.userId,
      userType: r.userType ?? "",
      name: r.name,
      image: r.image,
      isActive: r.isActive ?? null,
      uid: r.studentUid ?? r.staffUid ?? null,
      rfid: r.studentRfid ?? r.staffRfid ?? null,
      rollNumber: r.rollNumber ?? null,
      registrationNumber: r.registrationNumber ?? null,
      classRollNumber: r.classRollNumber ?? null,
      email: r.email,
      phone: r.phone,
      whatsapp: r.whatsapp,
      staffCode: r.staffCode ?? null,
      attendanceCode: r.attendanceCode ?? null,
      classOrSemester: promo?.className ?? null,
      shift,
      section: promo?.sectionName ?? null,
      programCourse: promo?.programCourseName ?? null,
      programCourseShortName: promo?.programCourseShortName ?? null,
      affiliation: promo?.affiliationName ?? null,
      affiliationShortName: promo?.affiliationShortName ?? null,
      regulationType: promo?.regulationTypeName ?? null,
      regulationTypeShortName: promo?.regulationTypeShortName ?? null,
    });
  }

  return out;
}

/**
 * Streams the entry/exit export directly to the response instead of
 * building the whole workbook in memory: rows are read from the DB in
 * fixed-size chunks (keyset-paginated on id, same `ORDER BY id DESC` as
 * before) and each chunk's user context is bulk-fetched (see
 * `getLibraryEntryExitPreviewHeadersByUserIds` above) instead of N+1'ing
 * `getLibraryEntryExitPreviewByUserId` per row. Column set, order, values
 * and styling are unchanged from the previous buffered implementation.
 */
export async function exportLibraryEntryExitExcel(
  filters: LibraryEntryExitExportFilters,
  res: Response,
): Promise<void> {
  const conditions = buildFilterConditions(filters);
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const CHUNK_SIZE = 2000;

  const formatDateTime = (value: Date | string | null) => {
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
  const toSentenceCase = (value: string | null | undefined) => {
    if (!value) return "";
    return value
      .toLowerCase()
      .split("_")
      .join(" ")
      .split(/\s+/)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ");
  };

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true,
  });
  const sheet = workbook.addWorksheet("Entry Exit", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Entry/Exit ID", key: "entryExitId", width: 14 },
    { header: "Name", key: "name", width: 28 },
    { header: "Current Status", key: "currentStatus", width: 16 },
    { header: "Entry Time", key: "entryTime", width: 24 },
    { header: "Exit Time", key: "exitTime", width: 24 },
    { header: "UID", key: "uid", width: 18 },
    { header: "RFID", key: "rfid", width: 18 },
    { header: "User Type", key: "userType", width: 14 },
    { header: "User Active", key: "userActive", width: 12 },

    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "WhatsApp", key: "whatsapp", width: 16 },
    { header: "Staff Code Number", key: "staffCode", width: 16 },
    { header: "Attendance Code", key: "attendanceCode", width: 18 },
    { header: "Affiliation", key: "affiliation", width: 24 },
    { header: "Regulation Type", key: "regulationType", width: 24 },
    { header: "Program Course", key: "programCourse", width: 24 },
    { header: "Class/Semester", key: "classOrSemester", width: 20 },
    { header: "Shift", key: "shift", width: 14 },
    { header: "Section", key: "section", width: 14 },
    { header: "Roll Number", key: "rollNumber", width: 18 },
    { header: "Registration Number", key: "registrationNumber", width: 20 },
    { header: "Class Roll Number", key: "classRollNumber", width: 18 },
  ];
  styleStreamedHeaderRow(sheet.getRow(1));
  sheet.getRow(1).commit();

  let lastId: number | null = null;
  for (;;) {
    const chunkConditions = [...conditions];
    if (lastId != null) {
      chunkConditions.push(lt(libraryEntryExitModel.id, lastId));
    }
    const chunkWhere = chunkConditions.length
      ? and(...chunkConditions)
      : undefined;

    const chunk = await db
      .select({
        id: libraryEntryExitModel.id,
        userId: libraryEntryExitModel.userId,
        currentStatus: libraryEntryExitModel.currentStatus,
        entryTimestamp: libraryEntryExitModel.entryTimestamp,
        exitTimestamp: libraryEntryExitModel.exitTimestamp,
      })
      .from(libraryEntryExitModel)
      .where(chunkWhere)
      .orderBy(desc(libraryEntryExitModel.id))
      .limit(CHUNK_SIZE);

    if (chunk.length === 0) break;

    const userHeaders = await getLibraryEntryExitPreviewHeadersByUserIds(
      chunk.map((row) => row.userId),
    );

    for (const row of chunk) {
      const user = userHeaders.get(row.userId);
      const dataRow = sheet.addRow({
        entryExitId: row.id,
        currentStatus: toSentenceCase(row.currentStatus),
        entryTime: formatDateTime(row.entryTimestamp),
        exitTime: formatDateTime(row.exitTimestamp),
        userId: row.userId,
        userType: toSentenceCase(user?.userType),
        userActive:
          user?.isActive === null || user?.isActive === undefined
            ? ""
            : user.isActive
              ? "Active"
              : "Inactive",
        name: user?.name ?? "",
        uid: user?.uid ?? "",
        rfid: user?.rfid ?? "",
        rollNumber: user?.rollNumber ?? "",
        registrationNumber: user?.registrationNumber ?? "",
        classRollNumber: user?.classRollNumber ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        whatsapp: user?.whatsapp ?? "",
        staffCode: user?.staffCode ?? "",
        attendanceCode: user?.attendanceCode ?? "",
        classOrSemester: user?.classOrSemester ?? "",
        shift: user?.shift ?? "",
        section: user?.section ?? "",
        programCourse:
          user?.programCourseShortName || user?.programCourse || "",
        affiliation: user?.affiliationShortName || user?.affiliation || "",
        regulationType:
          user?.regulationTypeShortName || user?.regulationType || "",
      });
      styleStreamedBodyRow(dataRow);
      dataRow.commit();
    }

    if (chunk.length < CHUNK_SIZE) break;
    lastId = chunk[chunk.length - 1].id;
  }

  sheet.commit();
  await workbook.commit();
}

export async function searchLibraryUsers(
  search: string,
  page: number,
  limit: number,
): Promise<LibrarySearchUsersResult> {
  const term = search.trim();
  if (!term) {
    return { rows: [], total: 0, page, limit };
  }

  const likeTerm = `%${term}%`;

  const normalizedTerm = term.toLowerCase();

  const studentMatches = await db
    .select({
      userId: userModel.id,
      userName: userModel.name,
      userType: userModel.type,
      uid: studentModel.uid,
      image: userModel.image,
      studentUid: studentModel.uid,
      rfidNumber: studentModel.rfidNumber,
      registrationNumber: studentModel.registrationNumber,
      rollNumber: studentModel.rollNumber,
    })
    .from(studentModel)
    .innerJoin(userModel, eq(studentModel.userId, userModel.id))
    .where(
      and(
        eq(userModel.type, "STUDENT"),
        // exact: uid/rfid/registration/roll ; partial: uid only
        or(
          eq(studentModel.uid, term),
          eq(studentModel.rfidNumber, term),
          eq(studentModel.registrationNumber, term),
          eq(studentModel.rollNumber, term),
          ilike(studentModel.uid, likeTerm),
        ),
      ),
    );

  const staffMatches = await db
    .select({
      userId: userModel.id,
      userName: userModel.name,
      userType: userModel.type,
      uid: staffModel.uid,
      image: userModel.image,
      staffUid: staffModel.uid,
      attendanceCode: staffModel.attendanceCode,
      codeNumber: staffModel.codeNumber,
    })
    .from(staffModel)
    .innerJoin(userModel, eq(staffModel.userId, userModel.id))
    .where(
      and(
        eq(userModel.type, "STAFF"),
        // exact: uid/attendance/code ; partial: uid only
        or(
          eq(staffModel.uid, term),
          eq(staffModel.codeNumber, term),
          eq(staffModel.attendanceCode, term),
          ilike(staffModel.uid, likeTerm),
        ),
      ),
    );

  const merged = [
    ...studentMatches.map((row) => {
      const candidates = [
        row.uid,
        row.rfidNumber,
        row.registrationNumber,
        row.rollNumber,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      const isExact = candidates.includes(normalizedTerm);
      return {
        userId: row.userId,
        userName: row.userName,
        userType: row.userType,
        uid: row.uid,
        image: row.image,
        studentUid: row.studentUid,
        isExact,
        sortUid: row.uid ?? "",
      };
    }),
    ...staffMatches.map((row) => {
      const candidates = [row.uid, row.attendanceCode, row.codeNumber]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());
      const isExact = candidates.includes(normalizedTerm);
      return {
        userId: row.userId,
        userName: row.userName,
        userType: row.userType,
        uid: row.uid,
        image: row.image,
        studentUid: null,
        isExact,
        sortUid: row.uid ?? "",
      };
    }),
  ]
    .sort((a, b) => {
      if (a.isExact !== b.isExact) return a.isExact ? -1 : 1;
      return a.sortUid.localeCompare(b.sortUid, undefined, { numeric: true });
    })
    .map<LibrarySearchUserRow>(
      ({ isExact: _isExact, sortUid: _sortUid, ...row }) => row,
    );

  const total = merged.length;
  const start = (page - 1) * limit;
  const rows = merged.slice(start, start + limit);

  return { rows, total, page, limit };
}

export async function getLibraryEntryExitPreviewByUserId(
  userId: number,
): Promise<LibraryEntryExitPreviewResult | null> {
  const [baseUser] = await db
    .select({
      userId: userModel.id,
      userType: userModel.type,
      name: userModel.name,
      image: userModel.image,
      isActive: userModel.isActive,
      email: userModel.email,
      phone: userModel.phone,
      whatsapp: userModel.whatsappNumber,
      studentId: studentModel.id,
      studentUid: studentModel.uid,
      studentRfid: studentModel.rfidNumber,
      rollNumber: studentModel.rollNumber,
      registrationNumber: studentModel.registrationNumber,
      classRollNumber: studentModel.classRollNumber,
      staffUid: staffModel.uid,
      staffRfid: staffModel.rfidNumber,
      staffCode: staffModel.codeNumber,
      attendanceCode: staffModel.attendanceCode,
    })
    .from(userModel)
    .leftJoin(studentModel, eq(studentModel.userId, userModel.id))
    .leftJoin(staffModel, eq(staffModel.userId, userModel.id))
    .where(eq(userModel.id, userId));

  if (!baseUser) return null;

  let classOrSemester: string | null = null;
  let shiftName: string | null = null;
  let sectionName: string | null = null;
  let programCourseName: string | null = null;
  let programCourseShortName: string | null = null;
  let affiliationName: string | null = null;
  let affiliationShortName: string | null = null;
  let regulationTypeName: string | null = null;
  let regulationTypeShortName: string | null = null;

  if (baseUser.studentId) {
    const [latestPromotion] = await db
      .select({
        className: classModel.name,
        shiftName: shiftModel.name,
        sectionName: sectionModel.name,
        programCourseName: programCourseModel.name,
        programCourseShortName: programCourseModel.shortName,
        affiliationName: affiliationModel.name,
        affiliationShortName: affiliationModel.shortName,
        regulationTypeName: regulationTypeModel.name,
        regulationTypeShortName: regulationTypeModel.shortName,
      })
      .from(promotionModel)
      .leftJoin(classModel, eq(promotionModel.classId, classModel.id))
      .leftJoin(shiftModel, eq(promotionModel.shiftId, shiftModel.id))
      .leftJoin(sectionModel, eq(promotionModel.sectionId, sectionModel.id))
      .leftJoin(
        programCourseModel,
        eq(promotionModel.programCourseId, programCourseModel.id),
      )
      .leftJoin(
        affiliationModel,
        eq(programCourseModel.affiliationId, affiliationModel.id),
      )
      .leftJoin(
        regulationTypeModel,
        eq(programCourseModel.regulationTypeId, regulationTypeModel.id),
      )
      .where(eq(promotionModel.studentId, baseUser.studentId))
      .orderBy(desc(promotionModel.id))
      .limit(1);

    classOrSemester = latestPromotion?.className ?? null;
    shiftName = latestPromotion?.shiftName ?? null;
    sectionName = latestPromotion?.sectionName ?? null;
    programCourseName = latestPromotion?.programCourseName ?? null;
    programCourseShortName = latestPromotion?.programCourseShortName ?? null;
    affiliationName = latestPromotion?.affiliationName ?? null;
    affiliationShortName = latestPromotion?.affiliationShortName ?? null;
    regulationTypeName = latestPromotion?.regulationTypeName ?? null;
    regulationTypeShortName = latestPromotion?.regulationTypeShortName ?? null;
  } else if (baseUser.userType === "STAFF") {
    const [staffShift] = await db
      .select({
        shiftName: shiftModel.name,
      })
      .from(staffModel)
      .leftJoin(shiftModel, eq(staffModel.shiftId, shiftModel.id))
      .where(eq(staffModel.userId, userId))
      .limit(1);
    shiftName = staffShift?.shiftName ?? null;
  }

  const circulationRowsDb = await db
    .select({
      id: bookCirculationModel.id,
      accessNumber: copyDetailsModel.accessNumber,
      title: bookModel.title,
      borrowingType: borrowingTypeModel.name,
      isReturned: bookCirculationModel.isReturned,
      issueTimestamp: bookCirculationModel.issueTimestamp,
      returnTimestamp: bookCirculationModel.returnTimestamp,
      actualReturnTimestamp: bookCirculationModel.actualReturnTimestamp,
    })
    .from(bookCirculationModel)
    .leftJoin(
      copyDetailsModel,
      eq(bookCirculationModel.copyDetailsId, copyDetailsModel.id),
    )
    .leftJoin(bookModel, eq(copyDetailsModel.bookId, bookModel.id))
    .leftJoin(
      borrowingTypeModel,
      eq(bookCirculationModel.borrowingTypeId, borrowingTypeModel.id),
    )
    .where(eq(bookCirculationModel.userId, userId))
    .orderBy(desc(bookCirculationModel.id));

  const now = Date.now();
  const circulationRows: LibraryEntryExitPreviewCirculationRow[] =
    circulationRowsDb.map((row) => {
      const approvedReturnMs = row.returnTimestamp
        ? new Date(row.returnTimestamp).getTime()
        : null;
      const actualReturnMs = row.actualReturnTimestamp
        ? new Date(row.actualReturnTimestamp).getTime()
        : null;
      const basisMs = actualReturnMs ?? now;
      let daysLate = 0;
      if (approvedReturnMs != null && basisMs > approvedReturnMs) {
        daysLate = Math.floor(
          (basisMs - approvedReturnMs) / (1000 * 60 * 60 * 24),
        );
      }

      return {
        id: row.id,
        accessNumber: row.accessNumber,
        title: row.title,
        author: null,
        borrowingType: row.borrowingType,
        status: row.isReturned ? "RETURNED" : "ISSUED",
        issuedTimestamp: row.issueTimestamp,
        approvedReturnTimestamp: row.returnTimestamp,
        returnTimestamp: row.actualReturnTimestamp,
        daysLate,
      };
    });

  return {
    user: {
      userId: baseUser.userId,
      userType: baseUser.userType,
      name: baseUser.name,
      image: baseUser.image,
      isActive: baseUser.isActive ?? null,
      uid: baseUser.studentUid ?? baseUser.staffUid ?? null,
      rfid: baseUser.studentRfid ?? baseUser.staffRfid ?? null,
      rollNumber: baseUser.rollNumber ?? null,
      registrationNumber: baseUser.registrationNumber ?? null,
      classRollNumber: baseUser.classRollNumber ?? null,
      email: baseUser.email,
      phone: baseUser.phone,
      whatsapp: baseUser.whatsapp,
      staffCode: baseUser.staffCode,
      attendanceCode: baseUser.attendanceCode,
      classOrSemester,
      shift: shiftName,
      section: sectionName,
      programCourse: programCourseName,
      programCourseShortName,
      affiliation: affiliationName,
      affiliationShortName,
      regulationType: regulationTypeName,
      regulationTypeShortName,
    },
    circulationRows,
    bookCirculationSummary: {
      booksIssued: circulationRows.length,
      booksDueForReturn: circulationRows.filter(
        (row) => row.status !== "RETURNED",
      ).length,
      booksReturned: circulationRows.filter((row) => row.status === "RETURNED")
        .length,
      totalDaysLate: circulationRows.reduce(
        (sum, row) => sum + row.daysLate,
        0,
      ),
    },
  };
}

export async function findLibraryEntryExitById(
  id: number,
): Promise<LibraryEntryExit | null> {
  const [row] = await db
    .select()
    .from(libraryEntryExitModel)
    .where(eq(libraryEntryExitModel.id, id));

  return row ?? null;
}

export async function createLibraryEntryExit(
  data: CreateLibraryEntryExitInput,
): Promise<LibraryEntryExit> {
  const [created] = await db
    .insert(libraryEntryExitModel)
    .values(data)
    .returning();
  return created;
}

export async function updateLibraryEntryExit(
  id: number,
  data: UpdateLibraryEntryExitInput,
): Promise<LibraryEntryExit | null> {
  const [updated] = await db
    .update(libraryEntryExitModel)
    .set(data)
    .where(eq(libraryEntryExitModel.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteLibraryEntryExit(
  id: number,
): Promise<LibraryEntryExit | null> {
  const [deleted] = await db
    .delete(libraryEntryExitModel)
    .where(eq(libraryEntryExitModel.id, id))
    .returning();

  return deleted ?? null;
}
