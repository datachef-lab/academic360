import { db } from "@/db/index.js";
// import { CourseLevel, courseLevelModel } from "../models/course-level.model.js";

// import { courseLevelModel, CourseLevel } from "@repo/db/schemas/models";

import { countDistinct, eq, ilike } from "drizzle-orm";
import { recomposeProgramCourseNamesFor } from "./program-course.service.js";
import { programCourseModel } from "@repo/db/schemas";
// import { insertCourseLevelSchema } from "../models/course-level.model";
import { z } from "zod";
import XLSX from "xlsx";
import fs from "fs";
import { courseLevelModel, CourseLevel } from "@repo/db/schemas";

// Types
// export type CourseLevelData = z.infer<typeof insertCourseLevelSchema>;

// Bulk upload interface
export interface BulkUploadResult {
  success: CourseLevel[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

const defaultCourseLevel: CourseLevel[] = [
  {
    name: "Undergraduate",
    shortName: "UG",
  },
  {
    name: "Postgraduate",
    shortName: "PG",
  },
];

export async function loadCourseLevel() {
  for (const courseLevel of defaultCourseLevel) {
    const [existingCourseLevel] = await db
      .select()
      .from(courseLevelModel)
      .where(ilike(courseLevelModel.name, courseLevel.name.trim()));
    if (existingCourseLevel) continue;

    const [created] = await db
      .insert(courseLevelModel)
      .values(courseLevel)
      .returning();
  }
}

// Create a new courseLevel
export const createCourseLevel = async (courseLevelData: CourseLevel) => {
  const { id, createdAt, updatedAt, ...props } = courseLevelData;

  const [existingCourseLevel] = await db
    .select()
    .from(courseLevelModel)
    .where(ilike(courseLevelModel.name, courseLevelData.name.trim()));

  if (existingCourseLevel) return null;

  const newCourseLevel = await db
    .insert(courseLevelModel)
    .values(props)
    .returning();
  return newCourseLevel[0];
};

// Bulk upload course levels
export const bulkUploadCourseLevels = async (
  filePath: string,
  io?: any,
  uploadSessionId?: string,
): Promise<BulkUploadResult> => {
  const result: BulkUploadResult = {
    success: [],
    errors: [],
  };

  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Skip header row and process data
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const rowNumber = i + 1;

      try {
        // Map Excel columns to our model
        const courseLevelData = {
          name: row[0]?.toString()?.trim(),
          shortName: row[1]?.toString()?.trim() || null,
          sequence: row[2] ? parseInt(row[2].toString()) : null,
          disabled:
            row[3]?.toString()?.toLowerCase() === "inactive" ||
            row[3]?.toString()?.toLowerCase() === "false",
        };

        // Validate required fields
        if (!courseLevelData.name) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: "Name is required",
          });
          continue;
        }

        // Check if sequence is unique (if provided)
        if (courseLevelData.sequence !== null) {
          const existingWithSequence = await db
            .select()
            .from(courseLevelModel)
            .where(eq(courseLevelModel.sequence, courseLevelData.sequence));

          if (existingWithSequence.length > 0) {
            result.errors.push({
              row: rowNumber,
              data: row,
              error: `Sequence ${courseLevelData.sequence} already exists`,
            });
            continue;
          }
        }

        // Insert the course level
        const newCourseLevel = await db
          .insert(courseLevelModel)
          .values(courseLevelData)
          .returning();

        result.success.push(newCourseLevel[0]);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        result.errors.push({
          row: rowNumber,
          data: row,
          error: errorMessage,
        });
      }
      if (io && uploadSessionId) {
        io.to(uploadSessionId).emit("bulk-upload-progress", {
          processed: i,
          total: data.length - 1,
          percent: Math.round((i / (data.length - 1)) * 100),
        });
      }
    }

    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

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
  } catch (error: unknown) {
    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process Excel file: ${errorMessage}`);
  }
};

// Get all courseLevels
export const getAllCourseLevels = async () => {
  const allCourseLevels = await db.select().from(courseLevelModel);
  return allCourseLevels;
};

// Get courseLevel by ID
export const findById = async (id: number) => {
  const courseLevel = await db
    .select()
    .from(courseLevelModel)
    .where(eq(courseLevelModel.id, id));
  return courseLevel.length > 0 ? courseLevel[0] : null;
};

// Update courseLevel
export const updateCourseLevel = async (
  id: string,
  courseLevelData: CourseLevel,
) => {
  // const validatedData = insertCourseLevelSchema.parse(courseLevelData);
  const { id: idObj, createdAt, updatedAt, ...props } = courseLevelData;
  const updatedCourseLevel = await db
    .update(courseLevelModel)
    .set(props)
    .where(eq(courseLevelModel.id, +id))
    .returning();
  if (props.shortName !== undefined || props.name !== undefined) {
    await recomposeProgramCourseNamesFor({ courseLevelId: +id });
  }
  return updatedCourseLevel.length > 0 ? updatedCourseLevel[0] : null;
};

// Delete courseLevel
export const deleteCourseLevel = async (id: string) => {
  const deletedCourseLevel = await db
    .delete(courseLevelModel)
    .where(eq(courseLevelModel.id, +id))
    .returning();
  return deletedCourseLevel.length > 0 ? deletedCourseLevel[0] : null;
};

export const deleteCourseLevelSafe = async (id: string) => {
  const [found] = await db
    .select()
    .from(courseLevelModel)
    .where(eq(courseLevelModel.id, +id));
  if (!found) return null;

  const [{ programCourseCount }] = await db
    .select({ programCourseCount: countDistinct(programCourseModel.id) })
    .from(programCourseModel)
    .where(eq(programCourseModel.courseLevelId, +id));

  if (programCourseCount > 0) {
    return {
      success: false,
      message:
        "Cannot delete course-level. It is associated with other records.",
      records: [{ count: programCourseCount, type: "Program-course" }],
    };
  }

  const deletedCourseLevel = await db
    .delete(courseLevelModel)
    .where(eq(courseLevelModel.id, +id))
    .returning();
  if (deletedCourseLevel.length > 0) {
    return {
      success: true,
      message: "Course-level deleted successfully.",
      records: [],
    };
  }
  return {
    success: false,
    message: "Failed to delete course-level.",
    records: [],
  };
};
