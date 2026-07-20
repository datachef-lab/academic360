/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db/index.js";
import {
  programCourseModel,
  ProgramCourse,
  NewProgramCourse,
  ProgramCourseT,
} from "@repo/db/schemas/models/course-design";
import { and, countDistinct, eq, ilike, ne, inArray } from "drizzle-orm";
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

// Compose program-course name using current related records
function composeProgramCourseName(args: {
  streamUgPrefix?: string | null;
  streamPgPrefix?: string | null;
  courseName?: string | null;
  courseTypeShort?: string | null;
  isPG: boolean;
}): string {
  const { streamUgPrefix, streamPgPrefix, courseName, courseTypeShort, isPG } =
    args;
  const prefix = (isPG ? streamPgPrefix : streamUgPrefix) || "";
  const left = prefix.trim();
  const right = courseTypeShort ? ` (${courseTypeShort})` : "";
  return [left, (courseName || "").trim()].filter(Boolean).join(" ") + right;
}

export async function recomposeProgramCourseNamesFor(filter: {
  streamId?: number;
  courseId?: number;
  courseTypeId?: number;
  courseLevelId?: number;
}) {
  const whereClauses: any[] = [];
  if (filter.streamId)
    whereClauses.push(eq(programCourseModel.streamId, filter.streamId));
  if (filter.courseId)
    whereClauses.push(eq(programCourseModel.courseId, filter.courseId));
  if (filter.courseTypeId)
    whereClauses.push(eq(programCourseModel.courseTypeId, filter.courseTypeId));
  if (filter.courseLevelId)
    whereClauses.push(
      eq(programCourseModel.courseLevelId, filter.courseLevelId),
    );

  if (whereClauses.length === 0) return;

  const pcs = await db
    .select()
    .from(programCourseModel)
    .where(
      whereClauses.length === 1
        ? whereClauses[0]
        : (and as any)(...whereClauses),
    );

  if (pcs.length === 0) return;

  // Preload lookups
  const streamIds = Array.from(
    new Set(pcs.map((p) => p.streamId).filter(Boolean)),
  ) as number[];
  const courseIds = Array.from(
    new Set(pcs.map((p) => p.courseId).filter(Boolean)),
  ) as number[];
  const courseTypeIds = Array.from(
    new Set(pcs.map((p) => p.courseTypeId).filter(Boolean)),
  ) as number[];
  const courseLevelIds = Array.from(
    new Set(pcs.map((p) => p.courseLevelId).filter(Boolean)),
  ) as number[];

  const [streams, courses, courseTypes, courseLevels] = await Promise.all([
    streamIds.length
      ? db
          .select()
          .from(streamModel)
          .where(
            streamIds.length === 1
              ? eq(streamModel.id, streamIds[0])
              : inArray(streamModel.id, streamIds),
          )
      : Promise.resolve([] as any[]),
    courseIds.length
      ? db
          .select()
          .from(courseModel)
          .where(
            courseIds.length === 1
              ? eq(courseModel.id, courseIds[0])
              : inArray(courseModel.id, courseIds),
          )
      : Promise.resolve([] as any[]),
    courseTypeIds.length
      ? db
          .select()
          .from(courseTypeModel)
          .where(
            courseTypeIds.length === 1
              ? eq(courseTypeModel.id, courseTypeIds[0])
              : inArray(courseTypeModel.id, courseTypeIds),
          )
      : Promise.resolve([] as any[]),
    courseLevelIds.length
      ? db
          .select()
          .from(courseLevelModel)
          .where(
            courseLevelIds.length === 1
              ? eq(courseLevelModel.id, courseLevelIds[0])
              : inArray(courseLevelModel.id, courseLevelIds),
          )
      : Promise.resolve([] as any[]),
  ]);

  const sMap = Object.fromEntries(streams.map((s) => [s.id, s]));
  const cMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const ctMap = Object.fromEntries(courseTypes.map((ct) => [ct.id, ct]));
  const clMap = Object.fromEntries(courseLevels.map((cl) => [cl.id, cl]));

  for (const pc of pcs) {
    const s = pc.streamId ? sMap[pc.streamId] : undefined;
    const c = pc.courseId ? cMap[pc.courseId] : undefined;
    const ct = pc.courseTypeId ? ctMap[pc.courseTypeId] : undefined;
    const cl = pc.courseLevelId ? clMap[pc.courseLevelId] : undefined;
    if (!s || !c || !ct || !cl) continue;

    const isPG = /post\s*grad|pg|postgrad|master|m\.|ph\.?d|doctor/i.test(
      `${cl.shortName || ""} ${cl.name || ""}`,
    );
    const composed = composeProgramCourseName({
      streamUgPrefix: s.ugPrefix ?? null,
      streamPgPrefix: s.pgPrefix ?? null,
      courseName: c.name ?? null,
      courseTypeShort: ct.shortName || ct.name || null,
      isPG,
    });

    if (pc.name !== composed) {
      await db
        .update(programCourseModel)
        .set({ name: composed })
        .where(eq(programCourseModel.id, pc.id));
      invalidateProgramCourseCache(pc.id);
    }
  }
}

export async function createProgramCourse(
  data: Omit<ProgramCourseT, "id" | "createdAt" | "updatedAt">,
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
        eq(programCourseModel.duration, data.duration!),
        eq(programCourseModel.totalSemesters, data.totalSemesters!),
      ),
    );

  if (existingProgramCourse) return null;

  //   const { name, ...rest } = data;

  const [created] = await db
    .insert(programCourseModel)
    .values(data)
    .returning();
  return created;
}

/**
 * Program-course DTOs are near-static reference data, but building one costs a row
 * fetch plus six joined-entity lookups. List endpoints call findById once per distinct
 * program course, so an uncached list of ~100 courses paid ~700 queries per request.
 *
 * Entries are invalidated explicitly on program-course writes and additionally expire
 * on a TTL, because a DTO also embeds course/courseType/courseLevel/affiliation/
 * regulationType/stream — those are edited through their own services, which cannot
 * reach in here to invalidate.
 */
const PROGRAM_COURSE_DTO_TTL_MS = 5 * 60 * 1000;
const programCourseDtoCache = new Map<
  number,
  { dto: ProgramCourseDto | null; expiresAt: number }
>();

export function invalidateProgramCourseCache(id?: number): void {
  if (typeof id === "number") programCourseDtoCache.delete(id);
  else programCourseDtoCache.clear();
}

export async function findById(id: number) {
  const cached = programCourseDtoCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.dto;
  }

  const [programCourse] = await db
    .select()
    .from(programCourseModel)
    .where(eq(programCourseModel.id, id));
  const dto = programCourse ? await modelToDto(programCourse) : null;

  programCourseDtoCache.set(id, {
    dto,
    expiresAt: Date.now() + PROGRAM_COURSE_DTO_TTL_MS,
  });
  return dto;
}

export async function findAllDtos() {
  const programCourses = await db.select().from(programCourseModel);
  return (
    await Promise.all(programCourses.map(async (pc) => await modelToDto(pc)))
  ).filter((ele) => ele !== null);
}

export async function getAllProgramCourses() {
  return db.select().from(programCourseModel);
}

export async function updateProgramCourse(
  id: number,
  data: Partial<ProgramCourse>,
) {
  // Ensure we are not creating a duplicate with the updated values
  const candidate = {
    streamId: data.streamId,
    courseId: data.courseId,
    courseTypeId: data.courseTypeId,
    courseLevelId: data.courseLevelId,
    affiliationId: data.affiliationId,
    regulationTypeId: data.regulationTypeId,
    duration: data.duration,
    totalSemesters: data.totalSemesters,
  };

  const allDefined = Object.values(candidate).every(
    (v) => v !== undefined && v !== null,
  );
  if (allDefined) {
    const [dup] = await db
      .select()
      .from(programCourseModel)
      .where(
        and(
          eq(programCourseModel.streamId, candidate.streamId as number),
          eq(programCourseModel.courseId, candidate.courseId as number),
          eq(programCourseModel.courseTypeId, candidate.courseTypeId as number),
          eq(
            programCourseModel.courseLevelId,
            candidate.courseLevelId as number,
          ),
          eq(
            programCourseModel.affiliationId,
            candidate.affiliationId as number,
          ),
          eq(
            programCourseModel.regulationTypeId,
            candidate.regulationTypeId as number,
          ),
          eq(programCourseModel.duration, candidate.duration as number),
          eq(
            programCourseModel.totalSemesters,
            candidate.totalSemesters as number,
          ),
          ne(programCourseModel.id, id),
        ),
      );
    if (dup) {
      return null; // indicate duplicate
    }
  }

  const { id: idObj, createdAt, updatedAt, ...props } = data;
  const [updated] = await db
    .update(programCourseModel)
    .set(props)
    .where(eq(programCourseModel.id, id))
    .returning();
  invalidateProgramCourseCache(id);
  return updated;
}

export async function deleteProgramCourse(id: number) {
  const [deleted] = await db
    .delete(programCourseModel)
    .where(eq(programCourseModel.id, id))
    .returning();
  invalidateProgramCourseCache(id);
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
  invalidateProgramCourseCache(id);
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

      // Check for duplicates before insertion
      const existingProgramCourse = await db
        .select()
        .from(programCourseModel)
        .where(
          and(
            eq(programCourseModel.streamId, streamId),
            eq(programCourseModel.courseId, courseId),
            eq(programCourseModel.courseTypeId, courseTypeId),
            eq(programCourseModel.courseLevelId, courseLevelId),
            eq(programCourseModel.affiliationId, affiliationId),
            eq(programCourseModel.regulationTypeId, regulationTypeId),
            eq(programCourseModel.duration, Number(duration)),
            eq(programCourseModel.totalSemesters, Number(totalSemesters)),
          ),
        );

      if (existingProgramCourse.length > 0) {
        unprocessedData.push({
          row: i + 2,
          data: row,
          reason: `Program course with this combination already exists (Stream: ${streamName}, Course: ${courseName}, Course Type: ${courseTypeName}, Course Level: ${courseLevelName}, Affiliation: ${affiliationName}, Regulation: ${regulationTypeName})`,
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

export async function modelToDto(
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

  // These six lookups are independent — awaiting them in sequence cost 6 serial
  // round trips per program course, which list endpoints pay once per distinct course.
  const [course, courseType, courseLevel, affiliation, regulationType, stream] =
    await Promise.all([
      courseId ? courseService.findById(courseId) : Promise.resolve(null),
      courseTypeId
        ? courseTypeService.findById(courseTypeId)
        : Promise.resolve(null),
      courseLevelId
        ? courseLevelService.findById(courseLevelId)
        : Promise.resolve(null),
      affiliationId
        ? affiliationService.findById(affiliationId)
        : Promise.resolve(null),
      regulationTypeId
        ? regulationTypeService.findById(regulationTypeId)
        : Promise.resolve(null),
      streamId ? streamService.findById(streamId) : Promise.resolve(null),
    ]);

  return {
    ...rest,
    course,
    courseType,
    courseLevel,
    affiliation,
    regulationType,
    stream,
  };
}
