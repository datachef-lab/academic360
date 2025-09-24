import { db } from "@/db/index.js";
import { countDistinct, eq } from "drizzle-orm";
import {
  paperModel,
  programCourseModel,
  courseModel,
  subjectModel,
} from "@repo/db/schemas/models/course-design";
import { relatedSubjectMainModel } from "@repo/db/schemas/models/subject-selection";
import { restrictedGroupingMainModel } from "@repo/db/schemas/models/subject-selection";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions";
import { boardSubjectModel } from "@repo/db/schemas/models/admissions";
import { academicYearModel } from "@repo/db/schemas/models/academics";

export interface AcademicSetupQuickCounts {
  programCourses: number;
  courses: number;
  universitySubjects: number;
  boardSubjects: number;
  restrictedCombinations: number;
  relatedSubjects: number;
}

export interface AcademicSetupYearwiseCounts extends AcademicSetupQuickCounts {
  yearId: number;
}

export async function getAcademicSetupQuickCounts(
  academicYearId: number,
): Promise<AcademicSetupQuickCounts> {
  const [{ programCourses }] = await db
    .select({ programCourses: countDistinct(paperModel.programCourseId) })
    .from(paperModel)
    .where(eq(paperModel.academicYearId, academicYearId));

  const [{ courses }] = await db
    .select({ courses: countDistinct(programCourseModel.courseId) })
    .from(paperModel)
    .leftJoin(
      programCourseModel,
      eq(programCourseModel.id, paperModel.programCourseId),
    )
    .leftJoin(courseModel, eq(courseModel.id, programCourseModel.courseId))
    .where(eq(paperModel.academicYearId, academicYearId));

  const [{ universitySubjects }] = await db
    .select({ universitySubjects: countDistinct(paperModel.subjectId) })
    .from(paperModel)
    .leftJoin(subjectModel, eq(subjectModel.id, paperModel.subjectId))
    .where(eq(paperModel.academicYearId, academicYearId));

  const [{ boardSubjects }] = await db
    .select({ boardSubjects: countDistinct(boardSubjectModel.id) })
    .from(relatedSubjectMainModel)
    .innerJoin(
      boardSubjectNameModel,
      eq(boardSubjectNameModel.id, relatedSubjectMainModel.boardSubjectNameId),
    )
    .innerJoin(
      boardSubjectModel,
      eq(boardSubjectModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(eq(relatedSubjectMainModel.academicYearId, academicYearId));

  const [{ restrictedCombinations }] = await db
    .select({
      restrictedCombinations: countDistinct(restrictedGroupingMainModel.id),
    })
    .from(restrictedGroupingMainModel)
    .where(eq(restrictedGroupingMainModel.academicYearId, academicYearId));

  const [{ relatedSubjects }] = await db
    .select({ relatedSubjects: countDistinct(relatedSubjectMainModel.id) })
    .from(relatedSubjectMainModel)
    .where(eq(relatedSubjectMainModel.academicYearId, academicYearId));

  return {
    programCourses: Number(programCourses ?? 0),
    courses: Number(courses ?? 0),
    universitySubjects: Number(universitySubjects ?? 0),
    boardSubjects: Number(boardSubjects ?? 0),
    restrictedCombinations: Number(restrictedCombinations ?? 0),
    relatedSubjects: Number(relatedSubjects ?? 0),
  };
}

export async function getAcademicSetupCountsGroupedByYear(): Promise<
  AcademicSetupYearwiseCounts[]
> {
  const years = await db
    .select({ yearId: academicYearModel.id })
    .from(academicYearModel)
    .orderBy(academicYearModel.id);

  const results: AcademicSetupYearwiseCounts[] = [];
  for (const row of years) {
    const yearIdNum = Number(row.yearId as unknown as number);
    const counts = await getAcademicSetupQuickCounts(yearIdNum);
    results.push({ yearId: yearIdNum, ...counts });
  }

  return results;
}
