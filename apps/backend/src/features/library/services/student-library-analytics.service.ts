import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { and, count, desc, eq, gte, lte, SQL, sql, sum } from "drizzle-orm";
import { studentLibraryAnalyticsModel } from "@repo/db/schemas/models/library/student-library-analytics.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { libraryEntryExitModel } from "@repo/db/schemas/models/library/library-entry-exit.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import { marksheetModel } from "@repo/db/schemas/models/academics/marksheet.model.js";

export type StudentAnalyticsRow =
  typeof studentLibraryAnalyticsModel.$inferSelect;

const buildWhere = (f: {
  userId?: number;
  academicYear?: string;
}): SQL | undefined => {
  const parts: SQL[] = [];
  if (f.userId != null)
    parts.push(eq(studentLibraryAnalyticsModel.userId, f.userId));
  if (f.academicYear?.trim())
    parts.push(
      eq(studentLibraryAnalyticsModel.academicYear, f.academicYear.trim()),
    );
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

export async function findAnalyticsPaginated(filters: {
  page: number;
  limit: number;
  userId?: number;
  academicYear?: string;
}) {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildWhere(rest);
  const [{ total }] = await db
    .select({ total: count() })
    .from(studentLibraryAnalyticsModel)
    .where(whereClause);
  const rows = await db
    .select()
    .from(studentLibraryAnalyticsModel)
    .where(whereClause)
    .orderBy(desc(studentLibraryAnalyticsModel.computedAt))
    .limit(limit)
    .offset(offset);
  return { rows, total, page, limit };
}

const yearRange = (academicYear: string): { start: Date; end: Date } => {
  // Accept formats like "2025-26" or "2025"
  const [a, b] = academicYear.split("-");
  const startYear = Number(a);
  if (Number.isNaN(startYear))
    throw new ApiError(400, "Invalid academicYear; use YYYY or YYYY-YY.");
  const endYear = b ? 2000 + Number(b) : startYear + 1;
  return {
    start: new Date(Date.UTC(startYear, 5, 1)), // Jun 1
    end: new Date(Date.UTC(endYear, 4, 31, 23, 59, 59)), // May 31
  };
};

export async function recomputeForUser(userId: number, academicYear: string) {
  if (!userId) throw new ApiError(400, "userId is required.");
  if (!academicYear?.trim())
    throw new ApiError(400, "academicYear is required.");
  const { start, end } = yearRange(academicYear);

  const [issuesAgg] = await db
    .select({
      totalIssues: count(),
      totalFinesPaid: sum(bookCirculationModel.fineAmount).mapWith(Number),
    })
    .from(bookCirculationModel)
    .where(
      and(
        eq(bookCirculationModel.userId, userId),
        gte(bookCirculationModel.issueTimestamp, start),
        lte(bookCirculationModel.issueTimestamp, end),
      ),
    );

  const [returnsAgg] = await db
    .select({ totalReturns: count() })
    .from(bookCirculationModel)
    .where(
      and(
        eq(bookCirculationModel.userId, userId),
        eq(bookCirculationModel.isReturned, true),
        gte(bookCirculationModel.issueTimestamp, start),
        lte(bookCirculationModel.issueTimestamp, end),
      ),
    );

  const [overdueAgg] = await db
    .select({ totalOverdue: count() })
    .from(bookCirculationModel)
    .where(
      and(
        eq(bookCirculationModel.userId, userId),
        eq(bookCirculationModel.isReturned, false),
        gte(bookCirculationModel.issueTimestamp, start),
        lte(bookCirculationModel.issueTimestamp, end),
      ),
    );

  const [visitsAgg] = await db
    .select({ libraryVisits: count() })
    .from(libraryEntryExitModel)
    .where(
      and(
        eq(libraryEntryExitModel.userId, userId),
        gte(libraryEntryExitModel.entryTimestamp, start),
        lte(libraryEntryExitModel.entryTimestamp, end),
      ),
    );

  // Average grade — pull sgpa rows from marksheets via studentId, filtered to
  // the academic-year start year. SGPA is a per-semester score; we average
  // every row in the window. Returns null if the student has no marksheets,
  // which is harmless and matches the prior behaviour.
  const academicYearStartYear = Number(academicYear.trim().split(/[-/]/)[0]);
  const [avgGradeRow] = academicYearStartYear
    ? await db
        .select({
          avg: sql<string | null>`AVG(${marksheetModel.sgpa})`,
        })
        .from(marksheetModel)
        .innerJoin(studentModel, eq(studentModel.id, marksheetModel.studentId))
        .where(
          and(
            eq(studentModel.userId, userId),
            eq(marksheetModel.year, academicYearStartYear),
          ),
        )
    : [{ avg: null }];
  const averageGrade =
    avgGradeRow?.avg != null && !Number.isNaN(Number(avgGradeRow.avg))
      ? Number(avgGradeRow.avg)
      : null;

  const payload = {
    userId,
    academicYear: academicYear.trim(),
    totalIssues: Number(issuesAgg?.totalIssues ?? 0),
    totalReturns: Number(returnsAgg?.totalReturns ?? 0),
    totalOverdue: Number(overdueAgg?.totalOverdue ?? 0),
    totalFinesPaid: Number(issuesAgg?.totalFinesPaid ?? 0),
    libraryVisits: Number(visitsAgg?.libraryVisits ?? 0),
    averageGrade,
    computedAt: new Date(),
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: studentLibraryAnalyticsModel.id })
    .from(studentLibraryAnalyticsModel)
    .where(
      and(
        eq(studentLibraryAnalyticsModel.userId, userId),
        eq(studentLibraryAnalyticsModel.academicYear, payload.academicYear),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(studentLibraryAnalyticsModel)
      .set(payload)
      .where(eq(studentLibraryAnalyticsModel.id, existing.id));
    return existing.id;
  }
  const [r] = await db
    .insert(studentLibraryAnalyticsModel)
    .values(payload)
    .returning({ id: studentLibraryAnalyticsModel.id });
  return r.id;
}
