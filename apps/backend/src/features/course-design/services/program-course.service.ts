import { db } from "@/db/index.js";
import {
  programCourseModel,
  ProgramCourse,
  NewProgramCourse,
} from "@repo/db/schemas/models/course-design";
import { and, countDistinct, eq, ilike } from "drizzle-orm";
import XLSX from "xlsx";
import fs from "fs";
import { streamModel } from "@repo/db/schemas/models/course-design";
import { courseModel } from "@repo/db/schemas/models/course-design";
import { courseTypeModel } from "@repo/db/schemas/models/course-design";
import { courseLevelModel } from "@repo/db/schemas/models/course-design";
import { affiliationModel } from "@repo/db/schemas/models/course-design";
import { regulationTypeModel } from "@repo/db/schemas/models/course-design";
import { paperModel } from "@repo/db/schemas/models/course-design";
import { ProgramCourseDto } from "@repo/db/dtos";

import * as courseService from "./course.service.js";
import * as courseTypeService from "./course-type.service.js";
import * as courseLevelService from "./course-level.service.js";
import * as affiliationService from "./affiliation.service.js";
import * as regulationTypeService from "./regulation-type.service.js";
import * as streamService from "./stream.service.js";

export async function createProgramCourse(
  data: Omit<ProgramCourse, "id" | "createdAt" | "updatedAt">,
) {
  const [existingProgramCourse] = await db
    .select()
    .from(programCourseModel)
    .where(
      and(
        eq(programCourseModel.streamId, data.streamId!),
        eq(programCourseModel.courseId, data.courseId!),
        eq(programCourseModel.courseTypeId, data.courseTypeId!),
        eq(programCourseModel.courseLevelId, data.courseLevelId!),
        eq(programCourseModel.affiliationId, data.affiliationId!),
        eq(programCourseModel.regulationTypeId, data.regulationTypeId!),
      ),
    );

  if (existingProgramCourse) return null;

  const [created] = await db
    .insert(programCourseModel)
    .values(data as any)
    .returning();
  return created;
}

export async function findById(id: number) {
  const [programCourse] = await db
    .select()
    .from(programCourseModel)
    .where(eq(programCourseModel.id, id));
  return programCourse ? await modelToDto(programCourse) : null;
}

export async function getAllProgramCourses() {
  return db.select().from(programCourseModel);
}

export async function updateProgramCourse(
  id: number,
  data: Partial<ProgramCourse>,
) {
  const { id: idObj, createdAt, updatedAt, ...props } = data;
  const [updated] = await db
    .update(programCourseModel)
    .set(props)
    .where(eq(programCourseModel.id, id))
    .returning();
  return updated;
}

export async function deleteProgramCourse(id: number) {
  const [deleted] = await db
    .delete(programCourseModel)
    .where(eq(programCourseModel.id, id))
    .returning();
  return deleted;
}

export async function deleteProgramCourseSafe(id: number) {
  const [found] = await db
    .select()
    .from(programCourseModel)
    .where(eq(programCourseModel.id, id));
  if (!found) return null;

  // Check dependent papers
  const [{ paperCount }] = await db
    .select({ paperCount: countDistinct(paperModel.id) })
    .from(paperModel)
    .where(eq(paperModel.programCourseId, id));

  if (paperCount > 0) {
    return {
      success: false,
      message:
        "Cannot delete program-course. It is associated with other records.",
      records: [{ count: paperCount, type: "Paper" }],
    };
  }

  const [deleted] = await db
    .delete(programCourseModel)
    .where(eq(programCourseModel.id, id))
    .returning();
  if (deleted)
    return {
      success: true,
      message: "Program course deleted successfully.",
      records: [],
    };
  return {
    success: false,
    message: "Failed to delete program course.",
    records: [],
  };
}

// Helper functions to find IDs by name
async function findStreamIdByName(name: string): Promise<number | null> {
  const [stream] = await db
    .select()
    .from(streamModel)
    .where(ilike(streamModel.name, name));
  return stream?.id || null;
}

async function findCourseIdByName(name: string): Promise<number | null> {
  const [course] = await db
    .select()
    .from(courseModel)
    .where(ilike(courseModel.name, name));
  return course?.id || null;
}

async function findCourseTypeIdByName(name: string): Promise<number | null> {
  const [courseType] = await db
    .select()
    .from(courseTypeModel)
    .where(ilike(courseTypeModel.name, name));
  return courseType?.id || null;
}

async function findCourseLevelIdByName(name: string): Promise<number | null> {
  const [courseLevel] = await db
    .select()
    .from(courseLevelModel)
    .where(ilike(courseLevelModel.name, name));
  return courseLevel?.id || null;
}

async function findAffiliationIdByName(name: string): Promise<number | null> {
  const [affiliation] = await db
    .select()
    .from(affiliationModel)
    .where(ilike(affiliationModel.name, name));
  return affiliation?.id || null;
}

async function findRegulationTypeIdByName(
  name: string,
): Promise<number | null> {
  const [regulationType] = await db
    .select()
    .from(regulationTypeModel)
    .where(ilike(regulationTypeModel.name, name));
  return regulationType?.id || null;
}

export interface BulkUploadResult {
  success: ProgramCourse[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
    unprocessedData?: unknown[];
  }>;
  unprocessedData: Array<{
    row: number;
    data: unknown[];
    reason: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    unprocessed: number;
  };
}

export const bulkUploadProgramCourses = async (
  filePath: string,
  io?: any,
  uploadSessionId?: string,
): Promise<BulkUploadResult> => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const rowsArr = Array.isArray(rows) ? rows : [];
  const [header, ...dataRows] = rowsArr;

  if (!Array.isArray(dataRows))
    return {
      success: [],
      errors: [],
      unprocessedData: [],
      summary: { total: 0, successful: 0, failed: 0, unprocessed: 0 },
    };

  const rowsArray: unknown[][] = dataRows as unknown[][];
  const success: ProgramCourse[] = [];
  const errors: BulkUploadResult["errors"] = [];
  const unprocessedData: BulkUploadResult["unprocessedData"] = [];

  for (let i = 0; i < rowsArray.length; i++) {
    const row = rowsArray[i];
    const [
      streamName,
      courseName,
      courseTypeName,
      courseLevelName,
      duration,
      totalSemesters,
      affiliationName,
      regulationTypeName,
      isActive,
    ] = row;

    if (
      !streamName ||
      !courseName ||
      !courseTypeName ||
      !courseLevelName ||
      !duration ||
      !totalSemesters ||
      !affiliationName ||
      !regulationTypeName
    ) {
      errors.push({
        row: i + 2,
        data: row,
        error: "All required fields must be provided.",
      });
      continue;
    }

    try {
      // Find IDs by names
      const streamId = await findStreamIdByName(streamName as string);
      const courseId = await findCourseIdByName(courseName as string);
      const courseTypeId = await findCourseTypeIdByName(
        courseTypeName as string,
      );
      const courseLevelId = await findCourseLevelIdByName(
        courseLevelName as string,
      );
      const affiliationId = await findAffiliationIdByName(
        affiliationName as string,
      );
      const regulationTypeId = await findRegulationTypeIdByName(
        regulationTypeName as string,
      );

      // Validate that all IDs were found
      if (!streamId) {
        unprocessedData.push({
          row: i + 2,
          data: row,
          reason: `Stream "${streamName}" not found.`,
        });
        continue;
      }
      if (!courseId) {
        unprocessedData.push({
          row: i + 2,
          data: row,
          reason: `Course "${courseName}" not found.`,
        });
        continue;
      }
      if (!courseTypeId) {
        unprocessedData.push({
          row: i + 2,
          data: row,
          reason: `Course Type "${courseTypeName}" not found.`,
        });
        continue;
      }
      if (!courseLevelId) {
        unprocessedData.push({
          row: i + 2,
          data: row,
          reason: `Course Level "${courseLevelName}" not found.`,
        });
        continue;
      }
      if (!affiliationId) {
        unprocessedData.push({
          row: i + 2,
          data: row,
          reason: `Affiliation "${affiliationName}" not found.`,
        });
        continue;
      }
      if (!regulationTypeId) {
        unprocessedData.push({
          row: i + 2,
          data: row,
          reason: `Regulation Type "${regulationTypeName}" not found.`,
        });
        continue;
      }

      const created = await db
        .insert(programCourseModel)
        .values({
          streamId,
          courseId,
          courseTypeId,
          courseLevelId,
          duration: Number(duration),
          totalSemesters: Number(totalSemesters),
          affiliationId,
          regulationTypeId,
          isActive:
            isActive === true ||
            isActive === "true" ||
            isActive === 1 ||
            isActive === "1",
        })
        .returning();
      success.push(created[0]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errors.push({ row: i + 2, data: row, error: errorMessage });
    }
    if (io && uploadSessionId) {
      io.to(uploadSessionId).emit("bulk-upload-progress", {
        processed: i,
        total: dataRows.length - 1,
        percent: Math.round((i / (dataRows.length - 1)) * 100),
      });
    }
  }

  // Clean up file
  fs.unlinkSync(filePath);

  const result: BulkUploadResult = {
    success,
    errors,
    unprocessedData,
    summary: {
      total: dataRows.length,
      successful: success.length,
      failed: errors.length,
      unprocessed: unprocessedData.length,
    },
  };

  if (io && uploadSessionId) {
    if (result.errors.length > 0) {
      io.to(uploadSessionId).emit("bulk-upload-failed", {
        errorCount: result.errors.length,
      });
    } else {
      io.to(uploadSessionId).emit("bulk-upload-done", {
        successCount: result.success.length,
      });
    }
  }

  return result;
};

async function modelToDto(
  programCourse: ProgramCourse,
): Promise<ProgramCourseDto | null> {
  if (!programCourse) return null;

  const {
    courseId,
    courseTypeId,
    courseLevelId,
    affiliationId,
    regulationTypeId,
    streamId,
    ...rest
  } = programCourse;

  return {
    ...rest,
    course: courseId ? await courseService.findById(courseId) : null,
    courseType: courseTypeId
      ? await courseTypeService.findById(courseTypeId)
      : null,
    courseLevel: courseLevelId
      ? await courseLevelService.findById(courseLevelId)
      : null,
    affiliation: affiliationId
      ? await affiliationService.findById(affiliationId)
      : null,
    regulationType: regulationTypeId
      ? await regulationTypeService.findById(regulationTypeId)
      : null,
    stream: streamId ? await streamService.findById(streamId) : null,
  };
}
