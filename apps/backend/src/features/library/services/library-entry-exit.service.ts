import { db } from "@/db/index.js";
import { LibraryEntryExit, libraryEntryExitModel } from "@repo/db/schemas";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { staffModel } from "@repo/db/schemas/models/user/staff.model.js";
import { and, count, desc, eq, gte, ilike, lt, or, SQL } from "drizzle-orm";

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
  page: number;
  limit: number;
};

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

const buildFilterConditions = (
  filters: Omit<LibraryEntryExitFilters, "page" | "limit">,
) => {
  const conditions: SQL[] = [];

  if (filters.search?.trim()) {
    conditions.push(ilike(userModel.name, `%${filters.search.trim()}%`));
  }

  if (filters.userType) {
    conditions.push(eq(userModel.type, filters.userType));
  }

  if (filters.currentStatus) {
    conditions.push(
      eq(libraryEntryExitModel.currentStatus, filters.currentStatus),
    );
  }

  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) {
      const next = new Date(start);
      next.setUTCDate(next.getUTCDate() + 1);
      conditions.push(gte(libraryEntryExitModel.entryTimestamp, start));
      conditions.push(lt(libraryEntryExitModel.entryTimestamp, next));
    }
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

  const [{ total }] = await db
    .select({ total: count() })
    .from(libraryEntryExitModel)
    .leftJoin(userModel, eq(libraryEntryExitModel.userId, userModel.id))
    .where(whereClause);

  return {
    rows,
    total,
    page,
    limit,
  };
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

  const studentMatches = await db
    .select({
      userId: userModel.id,
      userName: userModel.name,
      userType: userModel.type,
      uid: studentModel.uid,
      image: userModel.image,
      studentUid: studentModel.uid,
    })
    .from(studentModel)
    .innerJoin(userModel, eq(studentModel.userId, userModel.id))
    .where(
      and(
        eq(userModel.type, "STUDENT"),
        // Search by student identifiers only as requested:
        // uid, rfid, registration number, roll number
        or(
          ilike(studentModel.uid, likeTerm),
          ilike(studentModel.rfidNumber, likeTerm),
          ilike(studentModel.registrationNumber, likeTerm),
          ilike(studentModel.rollNumber, likeTerm),
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
    })
    .from(staffModel)
    .innerJoin(userModel, eq(staffModel.userId, userModel.id))
    .where(
      and(
        eq(userModel.type, "STAFF"),
        // staff: uid, code number, attendance code
        or(
          ilike(staffModel.uid, likeTerm),
          ilike(staffModel.codeNumber, likeTerm),
          ilike(staffModel.attendanceCode, likeTerm),
        ),
      ),
    );

  const merged: LibrarySearchUserRow[] = [
    ...studentMatches.map((row) => ({
      userId: row.userId,
      userName: row.userName,
      userType: row.userType,
      uid: row.uid,
      image: row.image,
      studentUid: row.studentUid,
    })),
    ...staffMatches.map((row) => ({
      userId: row.userId,
      userName: row.userName,
      userType: row.userType,
      uid: row.uid,
      image: row.image,
      studentUid: null,
    })),
  ].sort((a, b) => a.userName.localeCompare(b.userName));

  const total = merged.length;
  const start = (page - 1) * limit;
  const rows = merged.slice(start, start + limit);

  return { rows, total, page, limit };
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
