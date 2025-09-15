import { db } from "@/db/index.js";
import { relatedSubjectMainModel } from "@repo/db/schemas/models/subject-selection";
import {
  RelatedSubjectMain,
  RelatedSubjectMainT,
} from "@repo/db/schemas/models/subject-selection/related-subject-main.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import {
  RelatedSubjectMainDto,
  RelatedSubjectSubDto,
} from "@repo/db/dtos/subject-selection";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import { subjectTypeModel } from "@repo/db/schemas/models/course-design";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions";
import { relatedSubjectSubModel } from "@repo/db/schemas/models/subject-selection";
import XLSX from "xlsx";
import fs from "fs";

// Bulk upload interface
export interface RelatedSubjectMainBulkUploadResult {
  success: RelatedSubjectMainDto[];
  errors: Array<{
    row: number;
    data: unknown[];
    error: string;
  }>;
}

export async function createRelatedSubjectMain(
  data: RelatedSubjectMain,
): Promise<RelatedSubjectMainDto> {
  const [created] = await db
    .insert(relatedSubjectMainModel)
    .values(data)
    .returning();

  // Get related data for the created record
  const result = await getRelatedSubjectMainById(created.id);
  if (!result) {
    throw new Error("Failed to retrieve created related subject main");
  }
  return result;
}

export async function getAllRelatedSubjectMains(): Promise<
  RelatedSubjectMainDto[]
> {
  const results = await db
    .select({
      id: relatedSubjectMainModel.id,
      programCourseId: relatedSubjectMainModel.programCourseId,
      subjectTypeId: relatedSubjectMainModel.subjectTypeId,
      boardSubjectNameId: relatedSubjectMainModel.boardSubjectNameId,
      isActive: relatedSubjectMainModel.isActive,
      createdAt: relatedSubjectMainModel.createdAt,
      updatedAt: relatedSubjectMainModel.updatedAt,
      programCourse: {
        id: programCourseModel.id,
        name: programCourseModel.name,
        shortName: programCourseModel.shortName,
        isActive: programCourseModel.isActive,
      },
      subjectType: {
        id: subjectTypeModel.id,
        name: subjectTypeModel.name,
        code: subjectTypeModel.code,
        isActive: subjectTypeModel.isActive,
      },
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
      },
    })
    .from(relatedSubjectMainModel)
    .leftJoin(
      programCourseModel,
      eq(relatedSubjectMainModel.programCourseId, programCourseModel.id),
    )
    .leftJoin(
      subjectTypeModel,
      eq(relatedSubjectMainModel.subjectTypeId, subjectTypeModel.id),
    )
    .leftJoin(
      boardSubjectNameModel,
      eq(relatedSubjectMainModel.boardSubjectNameId, boardSubjectNameModel.id),
    );

  // Get related subject subs for each main
  const resultsWithSubs = await Promise.all(
    results.map(async (main) => {
      const subs = await db
        .select({
          id: relatedSubjectSubModel.id,
          relatedSubjectMainId: relatedSubjectSubModel.relatedSubjectMainId,
          boardSubjectNameId: relatedSubjectSubModel.boardSubjectNameId,
          createdAt: relatedSubjectSubModel.createdAt,
          updatedAt: relatedSubjectSubModel.updatedAt,
          boardSubjectName: {
            id: boardSubjectNameModel.id,
            name: boardSubjectNameModel.name,
            code: boardSubjectNameModel.code,
          },
        })
        .from(relatedSubjectSubModel)
        .leftJoin(
          boardSubjectNameModel,
          eq(
            relatedSubjectSubModel.boardSubjectNameId,
            boardSubjectNameModel.id,
          ),
        )
        .where(eq(relatedSubjectSubModel.relatedSubjectMainId, main.id));

      return {
        id: main.id,
        isActive: main.isActive,
        createdAt: main.createdAt,
        updatedAt: main.updatedAt,
        programCourse: {
          ...main.programCourse!,
          stream: null,
          course: null,
          courseType: null,
          courseLevel: null,
          affiliation: null,
          regulationType: null,
        } as any,
        subjectType: main.subjectType!,
        boardSubjectName: main.boardSubjectName!,
        relatedSubjectSubs: subs.map((sub) => ({
          id: sub.id,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
          boardSubjectName: sub.boardSubjectName!,
        })),
      };
    }),
  );

  return resultsWithSubs;
}

export async function findByAcademicYearIdAndProgramCourseId(
  academicYearId: number,
  programCourseId: number,
): Promise<RelatedSubjectMainDto[]> {
  const results = await db
    .select({
      id: relatedSubjectMainModel.id,
      programCourseId: relatedSubjectMainModel.programCourseId,
      subjectTypeId: relatedSubjectMainModel.subjectTypeId,
      boardSubjectNameId: relatedSubjectMainModel.boardSubjectNameId,
      isActive: relatedSubjectMainModel.isActive,
      createdAt: relatedSubjectMainModel.createdAt,
      updatedAt: relatedSubjectMainModel.updatedAt,
      programCourse: {
        id: programCourseModel.id,
        name: programCourseModel.name,
        shortName: programCourseModel.shortName,
        isActive: programCourseModel.isActive,
      },
      subjectType: {
        id: subjectTypeModel.id,
        name: subjectTypeModel.name,
        code: subjectTypeModel.code,
        isActive: subjectTypeModel.isActive,
      },
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
      },
    })
    .from(relatedSubjectMainModel)
    .leftJoin(
      programCourseModel,
      eq(relatedSubjectMainModel.programCourseId, programCourseModel.id),
    )
    .leftJoin(
      subjectTypeModel,
      eq(relatedSubjectMainModel.subjectTypeId, subjectTypeModel.id),
    )
    .leftJoin(
      boardSubjectNameModel,
      eq(relatedSubjectMainModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(
      and(
        eq(relatedSubjectMainModel.academicYearId, academicYearId),
        eq(relatedSubjectMainModel.programCourseId, programCourseId),
      ),
    );

  // Get related subject subs for each main
  const resultsWithSubs = await Promise.all(
    results.map(async (main: any) => {
      const subs = await db
        .select({
          id: relatedSubjectSubModel.id,
          relatedSubjectMainId: relatedSubjectSubModel.relatedSubjectMainId,
          boardSubjectNameId: relatedSubjectSubModel.boardSubjectNameId,
          createdAt: relatedSubjectSubModel.createdAt,
          updatedAt: relatedSubjectSubModel.updatedAt,
          boardSubjectName: {
            id: boardSubjectNameModel.id,
            name: boardSubjectNameModel.name,
            code: boardSubjectNameModel.code,
          },
        })
        .from(relatedSubjectSubModel)
        .leftJoin(
          boardSubjectNameModel,
          eq(
            relatedSubjectSubModel.boardSubjectNameId,
            boardSubjectNameModel.id,
          ),
        )
        .where(eq(relatedSubjectSubModel.relatedSubjectMainId, main.id));

      return {
        id: main.id,
        isActive: main.isActive,
        createdAt: main.createdAt,
        updatedAt: main.updatedAt,
        programCourse: {
          ...main.programCourse!,
          stream: null,
          course: null,
          courseType: null,
          courseLevel: null,
          affiliation: null,
          regulationType: null,
        } as any,
        subjectType: main.subjectType!,
        boardSubjectName: main.boardSubjectName!,
        relatedSubjectSubs: subs.map((sub) => ({
          id: sub.id,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
          boardSubjectName: sub.boardSubjectName!,
        })),
      };
    }),
  );

  return resultsWithSubs;
}
export async function getRelatedSubjectMainById(
  id: number,
): Promise<RelatedSubjectMainDto | null> {
  const [result] = await db
    .select({
      id: relatedSubjectMainModel.id,
      programCourseId: relatedSubjectMainModel.programCourseId,
      subjectTypeId: relatedSubjectMainModel.subjectTypeId,
      boardSubjectNameId: relatedSubjectMainModel.boardSubjectNameId,
      isActive: relatedSubjectMainModel.isActive,
      createdAt: relatedSubjectMainModel.createdAt,
      updatedAt: relatedSubjectMainModel.updatedAt,
      programCourse: {
        id: programCourseModel.id,
        name: programCourseModel.name,
        shortName: programCourseModel.shortName,
        isActive: programCourseModel.isActive,
      },
      subjectType: {
        id: subjectTypeModel.id,
        name: subjectTypeModel.name,
        code: subjectTypeModel.code,
        isActive: subjectTypeModel.isActive,
      },
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
      },
    })
    .from(relatedSubjectMainModel)
    .leftJoin(
      programCourseModel,
      eq(relatedSubjectMainModel.programCourseId, programCourseModel.id),
    )
    .leftJoin(
      subjectTypeModel,
      eq(relatedSubjectMainModel.subjectTypeId, subjectTypeModel.id),
    )
    .leftJoin(
      boardSubjectNameModel,
      eq(relatedSubjectMainModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(eq(relatedSubjectMainModel.id, id));

  if (!result) return null;

  // Get related subject subs
  const subs = await db
    .select({
      id: relatedSubjectSubModel.id,
      relatedSubjectMainId: relatedSubjectSubModel.relatedSubjectMainId,
      boardSubjectNameId: relatedSubjectSubModel.boardSubjectNameId,
      createdAt: relatedSubjectSubModel.createdAt,
      updatedAt: relatedSubjectSubModel.updatedAt,
      boardSubjectName: {
        id: boardSubjectNameModel.id,
        name: boardSubjectNameModel.name,
        code: boardSubjectNameModel.code,
      },
    })
    .from(relatedSubjectSubModel)
    .leftJoin(
      boardSubjectNameModel,
      eq(relatedSubjectSubModel.boardSubjectNameId, boardSubjectNameModel.id),
    )
    .where(eq(relatedSubjectSubModel.relatedSubjectMainId, result.id));

  return {
    id: result.id,
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    programCourse: {
      ...result.programCourse!,
      stream: null,
      course: null,
      courseType: null,
      courseLevel: null,
      affiliation: null,
      regulationType: null,
    } as any,
    subjectType: result.subjectType!,
    boardSubjectName: result.boardSubjectName!,
    relatedSubjectSubs: subs.map((sub) => ({
      id: sub.id,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      boardSubjectName: sub.boardSubjectName!,
    })),
  };
}

export async function updateRelatedSubjectMain(
  id: number,
  data: Partial<RelatedSubjectMain>,
): Promise<RelatedSubjectMainDto> {
  const [updated] = await db
    .update(relatedSubjectMainModel)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(relatedSubjectMainModel.id, id))
    .returning();

  // Get related data for the updated record
  const result = await getRelatedSubjectMainById(updated.id);
  if (!result) {
    throw new Error("Failed to retrieve updated related subject main");
  }
  return result;
}

export async function deleteRelatedSubjectMain(id: number) {
  // First delete related subs
  await db
    .delete(relatedSubjectSubModel)
    .where(eq(relatedSubjectSubModel.relatedSubjectMainId, id));

  // Then delete main
  const [deleted] = await db
    .delete(relatedSubjectMainModel)
    .where(eq(relatedSubjectMainModel.id, id))
    .returning();
  return deleted;
}

export async function bulkUploadRelatedSubjectMains(
  file: Express.Multer.File,
): Promise<RelatedSubjectMainBulkUploadResult> {
  const workbook = XLSX.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const success: RelatedSubjectMainDto[] = [];
  const errors: Array<{ row: number; data: unknown[]; error: string }> = [];

  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i] as any;
      const relatedSubjectMainData: RelatedSubjectMain = {
        programCourseId: row.programCourseId,
        subjectTypeId: row.subjectTypeId,
        boardSubjectNameId: row.boardSubjectNameId,
        isActive: row.isActive !== undefined ? row.isActive : true,
      };

      const created = await createRelatedSubjectMain(relatedSubjectMainData);
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
