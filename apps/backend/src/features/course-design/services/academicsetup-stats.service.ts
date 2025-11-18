import { db } from "@/db/index.js";
import { and, count, desc, eq } from "drizzle-orm";
import {
  programCourseModel,
  subjectModel,
} from "@repo/db/schemas/models/course-design";
import {
  admissionModel,
  admissionProgramCourseModel,
  boardSubjectModel,
} from "@repo/db/schemas/models/admissions";
import { boardModel } from "@repo/db/schemas/models/resources";
import {
  academicYearModel,
  sessionModel,
} from "@repo/db/schemas/models/academics";

const toNumber = (value: number | bigint | null | undefined): number => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return 0;
};

export interface AdmissionProgramCourseYearStat {
  academicYearId: number | null;
  academicYear: string | null;
  sessionId: number;
  sessionName: string;
  total: number;
}

export interface AcademicSetupStatsOptions {
  academicYearId?: number;
  academicYear?: string;
}

export interface AcademicSetupStats {
  programCoursesCount: number;
  admissionProgramCoursesTotal: number;
  subjectsCount: number;
  boardSubjects12thCount: number;
  boardsCount: number;
}

export async function getAcademicSetupStats(
  options: AcademicSetupStatsOptions = {},
): Promise<AcademicSetupStats> {
  const { academicYearId, academicYear } = options;

  const admissionProgramCourseWhere: any[] = [];
  if (typeof academicYearId === "number" && !Number.isNaN(academicYearId)) {
    admissionProgramCourseWhere.push(
      eq(sessionModel.academicYearId, academicYearId),
    );
  }
  if (academicYear) {
    admissionProgramCourseWhere.push(eq(academicYearModel.year, academicYear));
  }
  const admissionProgramCourseFilters =
    admissionProgramCourseWhere.length > 0
      ? (and as any)(...admissionProgramCourseWhere)
      : undefined;

  const [
    programCoursesResult,
    subjectsResult,
    boardSubjectsResult,
    boardsResult,
    admissionProgramCoursesGrouped,
  ] = await Promise.all([
    db.select({ value: count() }).from(programCourseModel),
    db.select({ value: count() }).from(subjectModel),
    db.select({ value: count() }).from(boardSubjectModel),
    db.select({ value: count() }).from(boardModel),
    (() => {
      const query = db
        .select({
          academicYearId: academicYearModel.id,
          academicYear: academicYearModel.year,
          sessionId: sessionModel.id,
          sessionName: sessionModel.name,
          total: count(admissionProgramCourseModel.id),
        })
        .from(admissionProgramCourseModel)
        .innerJoin(
          admissionModel,
          eq(admissionProgramCourseModel.admissionId, admissionModel.id),
        )
        .innerJoin(sessionModel, eq(admissionModel.sessionId, sessionModel.id))
        .leftJoin(
          academicYearModel,
          eq(sessionModel.academicYearId, academicYearModel.id),
        )
        .groupBy(
          academicYearModel.id,
          academicYearModel.year,
          sessionModel.id,
          sessionModel.name,
          sessionModel.from,
        )
        .orderBy(desc(sessionModel.from), desc(sessionModel.id));
      return admissionProgramCourseFilters
        ? query.where(admissionProgramCourseFilters)
        : query;
    })(),
  ]);

  const programCoursesCount = toNumber(programCoursesResult[0]?.value);
  const subjectsCount = toNumber(subjectsResult[0]?.value);
  const boardSubjects12thCount = toNumber(boardSubjectsResult[0]?.value);
  const boardsCount = toNumber(boardsResult[0]?.value);

  const totalAdmissionProgramCourses = admissionProgramCoursesGrouped.reduce(
    (sum, row) => sum + toNumber(row.total),
    0,
  );

  return {
    programCoursesCount,
    admissionProgramCoursesTotal: totalAdmissionProgramCourses,
    subjectsCount,
    boardSubjects12thCount,
    boardsCount,
  };
}
