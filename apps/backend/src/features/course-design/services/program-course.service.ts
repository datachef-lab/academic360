import { db } from "@/db/index.js";
import { programCourses, ProgramCourse, NewProgramCourse } from "@/features/course-design/models/program-course.model.js";
import { eq, ilike } from "drizzle-orm";
import * as XLSX from "xlsx";
import fs from "fs";
import { streamModel } from "@/features/course-design/models/stream.model.js";
import { courseModel } from "@/features/course-design/models/course.model.js";
import { courseTypeModel } from "@/features/course-design/models/course-type.model.js";
import { courseLevelModel } from "@/features/course-design/models/course-level.model.js";
import { affiliationModel } from "@/features/course-design/models/affiliation.model.js";
import { regulationTypeModel } from "@/features/course-design/models/regulation-type.model.js";

export async function createProgramCourse(data: Omit<ProgramCourse, 'id' | 'createdAt' | 'updatedAt'>) {
    const [created] = await db.insert(programCourses).values(data).returning();
    return created;
}

export async function getProgramCourseById(id: number) {
    const [programCourse] = await db.select().from(programCourses).where(eq(programCourses.id, id));
    return programCourse;
}

export async function getAllProgramCourses() {
    return db.select().from(programCourses);
}

export async function updateProgramCourse(id: number, data: Partial<ProgramCourse>) {
    const { id: idObj, createdAt, updatedAt, ...props } = data;
    const [updated] = await db.update(programCourses).set(props).where(eq(programCourses.id, id)).returning();
    return updated;
}

export async function deleteProgramCourse(id: number) {
    const [deleted] = await db.delete(programCourses).where(eq(programCourses.id, id)).returning();
    return deleted;
}

// Helper functions to find IDs by name
async function findStreamIdByName(name: string): Promise<number | null> {
    const [stream] = await db.select().from(streamModel).where(ilike(streamModel.name, name));
    return stream?.id || null;
}

async function findCourseIdByName(name: string): Promise<number | null> {
    const [course] = await db.select().from(courseModel).where(ilike(courseModel.name, name));
    return course?.id || null;
}

async function findCourseTypeIdByName(name: string): Promise<number | null> {
    const [courseType] = await db.select().from(courseTypeModel).where(ilike(courseTypeModel.name, name));
    return courseType?.id || null;
}

async function findCourseLevelIdByName(name: string): Promise<number | null> {
    const [courseLevel] = await db.select().from(courseLevelModel).where(ilike(courseLevelModel.name, name));
    return courseLevel?.id || null;
}

async function findAffiliationIdByName(name: string): Promise<number | null> {
    const [affiliation] = await db.select().from(affiliationModel).where(ilike(affiliationModel.name, name));
    return affiliation?.id || null;
}

async function findRegulationTypeIdByName(name: string): Promise<number | null> {
    const [regulationType] = await db.select().from(regulationTypeModel).where(ilike(regulationTypeModel.name, name));
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

export const bulkUploadProgramCourses = async (filePath: string): Promise<BulkUploadResult> => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const rowsArr = Array.isArray(rows) ? rows : [];
  const [header, ...dataRows] = rowsArr;

  if (!Array.isArray(dataRows)) return {
    success: [],
    errors: [],
    unprocessedData: [],
    summary: { total: 0, successful: 0, failed: 0, unprocessed: 0 }
  };

  const rowsArray: unknown[][] = dataRows as unknown[][];
  const success: ProgramCourse[] = [];
  const errors: BulkUploadResult["errors"] = [];
  const unprocessedData: BulkUploadResult["unprocessedData"] = [];

  for (let i = 0; i < rowsArray.length; i++) {
    const row = rowsArray[i];
    const [streamName, courseName, courseTypeName, courseLevelName, duration, totalSemesters, affiliationName, regulationTypeName, disabled] = row;
    
    if (!streamName || !courseName || !courseTypeName || !courseLevelName || !duration || !totalSemesters || !affiliationName || !regulationTypeName) {
      errors.push({ row: i + 2, data: row, error: "All required fields must be provided." });
      continue;
    }
    
    try {
      // Find IDs by names
      const streamId = await findStreamIdByName(streamName as string);
      const courseId = await findCourseIdByName(courseName as string);
      const courseTypeId = await findCourseTypeIdByName(courseTypeName as string);
      const courseLevelId = await findCourseLevelIdByName(courseLevelName as string);
      const affiliationId = await findAffiliationIdByName(affiliationName as string);
      const regulationTypeId = await findRegulationTypeIdByName(regulationTypeName as string);

      // Validate that all IDs were found
      if (!streamId) {
        unprocessedData.push({ row: i + 2, data: row, reason: `Stream "${streamName}" not found.` });
        continue;
      }
      if (!courseId) {
        unprocessedData.push({ row: i + 2, data: row, reason: `Course "${courseName}" not found.` });
        continue;
      }
      if (!courseTypeId) {
        unprocessedData.push({ row: i + 2, data: row, reason: `Course Type "${courseTypeName}" not found.` });
        continue;
      }
      if (!courseLevelId) {
        unprocessedData.push({ row: i + 2, data: row, reason: `Course Level "${courseLevelName}" not found.` });
        continue;
      }
      if (!affiliationId) {
        unprocessedData.push({ row: i + 2, data: row, reason: `Affiliation "${affiliationName}" not found.` });
        continue;
      }
      if (!regulationTypeId) {
        unprocessedData.push({ row: i + 2, data: row, reason: `Regulation Type "${regulationTypeName}" not found.` });
        continue;
      }

      const created = await db.insert(programCourses).values({
        streamId,
        courseId,
        courseTypeId,
        courseLevelId,
        duration: Number(duration),
        totalSemesters: Number(totalSemesters),
        affiliationId,
        regulationTypeId,
        disabled: disabled === true || disabled === "true" || disabled === 1 || disabled === "1"
      }).returning();
      success.push(created[0]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      errors.push({ row: i + 2, data: row, error: errorMessage });
    }
  }

  // Clean up file
  fs.unlinkSync(filePath);

  return {
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
};
