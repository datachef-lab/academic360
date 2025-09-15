import { db } from "@/db/index.js";
import { restrictedGroupingProgramCourseModel } from "@repo/db/schemas/models/subject-selection";
import {
  RestrictedGroupingProgramCourse,
  RestrictedGroupingProgramCourseT,
} from "@repo/db/schemas/models/subject-selection/restricted-grouping-program-course.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { RestrictedGroupingProgramCourseDto } from "@repo/db/dtos/subject-selection";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import XLSX from "xlsx";
import fs from "fs";

// Bulk upload interface
export interface RestrictedGroupingProgramCourseBulkUploadResult {
  success: RestrictedGroupingProgramCourseDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createRestrictedGroupingProgramCourse(
  data: RestrictedGroupingProgramCourse,
): Promise<RestrictedGroupingProgramCourseDto> {
  const [created] = await db
    .insert(restrictedGroupingProgramCourseModel)
    .values(data)
    .returning();

  // Get related data for the created record
  const result = await getRestrictedGroupingProgramCourseById(created.id);
  if (!result) {
    throw new Error(
      "Failed to retrieve created restricted grouping program course",
    );
  }
  return result;
}

export async function getAllRestrictedGroupingProgramCourses(): Promise<
  RestrictedGroupingProgramCourseDto[]
> {
  const results = await db
    .select({
      id: restrictedGroupingProgramCourseModel.id,
      restrictedGroupingMainId:
        restrictedGroupingProgramCourseModel.restrictedGroupingMainId,
      programCourseId: restrictedGroupingProgramCourseModel.programCourseId,
      createdAt: restrictedGroupingProgramCourseModel.createdAt,
      updatedAt: restrictedGroupingProgramCourseModel.updatedAt,
      programCourse: {
        id: programCourseModel.id,
        name: programCourseModel.name,
        shortName: programCourseModel.shortName,
        duration: programCourseModel.duration,
        totalSemesters: programCourseModel.totalSemesters,
        streamId: programCourseModel.streamId,
        courseId: programCourseModel.courseId,
        courseTypeId: programCourseModel.courseTypeId,
        courseLevelId: programCourseModel.courseLevelId,
        affiliationId: programCourseModel.affiliationId,
        regulationTypeId: programCourseModel.regulationTypeId,
        isActive: programCourseModel.isActive,
        createdAt: programCourseModel.createdAt,
        updatedAt: programCourseModel.updatedAt,
      },
    })
    .from(restrictedGroupingProgramCourseModel)
    .leftJoin(
      programCourseModel,
      eq(
        restrictedGroupingProgramCourseModel.programCourseId,
        programCourseModel.id,
      ),
    );

  return results.map((result) => ({
    id: result.id,
    restrictedGroupingMainId: result.restrictedGroupingMainId,
    programCourse: result.programCourse || {
      id: 0,
      name: "Unknown Program Course",
      shortName: null,
      duration: 0,
      totalSemesters: 0,
      isActive: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      streamId: null,
      courseId: null,
      courseTypeId: null,
      courseLevelId: null,
      affiliationId: null,
      regulationTypeId: null,
    },
  }));
}

export async function getRestrictedGroupingProgramCourseById(
  id: number,
): Promise<RestrictedGroupingProgramCourseDto | null> {
  const [result] = await db
    .select({
      id: restrictedGroupingProgramCourseModel.id,
      restrictedGroupingMainId:
        restrictedGroupingProgramCourseModel.restrictedGroupingMainId,
      programCourseId: restrictedGroupingProgramCourseModel.programCourseId,
      createdAt: restrictedGroupingProgramCourseModel.createdAt,
      updatedAt: restrictedGroupingProgramCourseModel.updatedAt,
      programCourse: {
        id: programCourseModel.id,
        name: programCourseModel.name,
        shortName: programCourseModel.shortName,
        duration: programCourseModel.duration,
        totalSemesters: programCourseModel.totalSemesters,
        streamId: programCourseModel.streamId,
        courseId: programCourseModel.courseId,
        courseTypeId: programCourseModel.courseTypeId,
        courseLevelId: programCourseModel.courseLevelId,
        affiliationId: programCourseModel.affiliationId,
        regulationTypeId: programCourseModel.regulationTypeId,
        isActive: programCourseModel.isActive,
        createdAt: programCourseModel.createdAt,
        updatedAt: programCourseModel.updatedAt,
      },
    })
    .from(restrictedGroupingProgramCourseModel)
    .leftJoin(
      programCourseModel,
      eq(
        restrictedGroupingProgramCourseModel.programCourseId,
        programCourseModel.id,
      ),
    )
    .where(eq(restrictedGroupingProgramCourseModel.id, id));

  if (!result) return null;

  return {
    id: result.id,
    restrictedGroupingMainId: result.restrictedGroupingMainId,
    programCourse: result.programCourse || {
      id: 0,
      name: "Unknown Program Course",
      shortName: null,
      duration: 0,
      totalSemesters: 0,
      isActive: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      streamId: null,
      courseId: null,
      courseTypeId: null,
      courseLevelId: null,
      affiliationId: null,
      regulationTypeId: null,
    },
  };
}

export async function getRestrictedGroupingProgramCoursesByMainId(
  mainId: number,
): Promise<RestrictedGroupingProgramCourseDto[]> {
  const results = await db
    .select({
      id: restrictedGroupingProgramCourseModel.id,
      restrictedGroupingMainId:
        restrictedGroupingProgramCourseModel.restrictedGroupingMainId,
      programCourseId: restrictedGroupingProgramCourseModel.programCourseId,
      createdAt: restrictedGroupingProgramCourseModel.createdAt,
      updatedAt: restrictedGroupingProgramCourseModel.updatedAt,
      programCourse: {
        id: programCourseModel.id,
        name: programCourseModel.name,
        shortName: programCourseModel.shortName,
        duration: programCourseModel.duration,
        totalSemesters: programCourseModel.totalSemesters,
        streamId: programCourseModel.streamId,
        courseId: programCourseModel.courseId,
        courseTypeId: programCourseModel.courseTypeId,
        courseLevelId: programCourseModel.courseLevelId,
        affiliationId: programCourseModel.affiliationId,
        regulationTypeId: programCourseModel.regulationTypeId,
        isActive: programCourseModel.isActive,
        createdAt: programCourseModel.createdAt,
        updatedAt: programCourseModel.updatedAt,
      },
    })
    .from(restrictedGroupingProgramCourseModel)
    .leftJoin(
      programCourseModel,
      eq(
        restrictedGroupingProgramCourseModel.programCourseId,
        programCourseModel.id,
      ),
    )
    .where(
      eq(restrictedGroupingProgramCourseModel.restrictedGroupingMainId, mainId),
    );

  return results.map((result) => ({
    id: result.id,
    restrictedGroupingMainId: result.restrictedGroupingMainId,
    programCourse: result.programCourse || {
      id: 0,
      name: "Unknown Program Course",
      shortName: null,
      duration: 0,
      totalSemesters: 0,
      isActive: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      streamId: null,
      courseId: null,
      courseTypeId: null,
      courseLevelId: null,
      affiliationId: null,
      regulationTypeId: null,
    },
  }));
}

export async function updateRestrictedGroupingProgramCourse(
  id: number,
  data: Partial<RestrictedGroupingProgramCourse>,
): Promise<RestrictedGroupingProgramCourseDto> {
  const [updated] = await db
    .update(restrictedGroupingProgramCourseModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(restrictedGroupingProgramCourseModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getRestrictedGroupingProgramCourseById(updated.id);
  if (!result) {
    throw new Error(
      "Failed to retrieve updated restricted grouping program course",
    );
  }
  return result;
}

export async function deleteRestrictedGroupingProgramCourse(id: number) {
  const [deleted] = await db
    .delete(restrictedGroupingProgramCourseModel)
    .where(eq(restrictedGroupingProgramCourseModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadRestrictedGroupingProgramCourses(
  file: Express.Multer.File,
): Promise<RestrictedGroupingProgramCourseBulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: RestrictedGroupingProgramCourseDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const restrictedGroupingProgramCourseData: RestrictedGroupingProgramCourse =
        {
          restrictedGroupingMainId: row.restrictedGroupingMainId,
          programCourseId: row.programCourseId,
        };

      const created = await createRestrictedGroupingProgramCourse(
        restrictedGroupingProgramCourseData,
      );
      success.push(created);
    } catch (error) {
      errors.push({
        row: i + 2, // +2 because Excel is 1-indexed and we skip header
        data: Object.values(data[i] as any),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Clean up file
  fs.unlinkSync(file.path);

  return { success, errors };
}
