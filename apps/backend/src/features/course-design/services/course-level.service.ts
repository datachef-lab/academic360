import { db } from "@/db";
import { CourseLevel, courseLevelModel } from "../models/course-level.model";
import { eq } from "drizzle-orm";
// import { insertCourseLevelSchema } from "../models/course-level.model";
import { z } from "zod";
import * as XLSX from "xlsx";
import fs from "fs";

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

// Create a new courseLevel
export const createCourseLevel = async (courseLevelData: CourseLevel) => {
  const { id, createdAt, updatedAt, ...props } = courseLevelData;
  // const validatedData = insertCourseLevelSchema.parse(courseLevelData);
  const newCourseLevel = await db.insert(courseLevelModel).values(props).returning();
  return newCourseLevel[0];
};

// Bulk upload course levels
export const bulkUploadCourseLevels = async (filePath: string): Promise<BulkUploadResult> => {
  const result: BulkUploadResult = {
    success: [],
    errors: []
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
          disabled: row[3]?.toString()?.toLowerCase() === 'inactive' || row[3]?.toString()?.toLowerCase() === 'false',
        };

        // Validate required fields
        if (!courseLevelData.name) {
          result.errors.push({
            row: rowNumber,
            data: row,
            error: "Name is required"
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
              error: `Sequence ${courseLevelData.sequence} already exists`
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
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result.errors.push({
          row: rowNumber,
          data: row,
          error: errorMessage
        });
      }
    }

    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error: unknown) {
    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process Excel file: ${errorMessage}`);
  }
};

// Get all courseLevels
export const getAllCourseLevels = async () => {
  const allCourseLevels = await db.select().from(courseLevelModel);
  return allCourseLevels;
};

// Get courseLevel by ID
export const getCourseLevelById = async (id: string) => {
  const courseLevel = await db.select().from(courseLevelModel).where(eq(courseLevelModel.id, +id));
  return courseLevel.length > 0 ? courseLevel[0] : null;
};

// Update courseLevel
export const updateCourseLevel = async (id: string, courseLevelData: CourseLevel) => {
  // const validatedData = insertCourseLevelSchema.parse(courseLevelData);
  const { id: idObj, createdAt, updatedAt, ...props } = courseLevelData;
  const updatedCourseLevel = await db
    .update(courseLevelModel)
    .set(props)
    .where(eq(courseLevelModel.id, +id))
    .returning();
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
