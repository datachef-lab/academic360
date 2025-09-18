import { db } from "@/db/index.js";
import { relatedSubjectMainModel } from "@repo/db/schemas/models/subject-selection";
import {
  RelatedSubjectMain,
  RelatedSubjectMainT,
} from "@repo/db/schemas/models/subject-selection/related-subject-main.model";
import { and, countDistinct, eq, ilike, ne } from "drizzle-orm";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import {
  RelatedSubjectMainDto,
  RelatedSubjectSubDto,
} from "@repo/db/dtos/subject-selection";
import { programCourseModel } from "@repo/db/schemas/models/course-design";
import { subjectTypeModel } from "@repo/db/schemas/models/course-design";
import { boardSubjectNameModel } from "@repo/db/schemas/models/admissions";
import { relatedSubjectSubModel } from "@repo/db/schemas/models/subject-selection";
import { academicYearModel } from "@repo/db/schemas/models/academics";
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

// DTO-shaped input used by frontend and for future compatibility
export type CreateRelatedSubjectMainDtoInput = {
  programCourse: { id: number };
  subjectType: { id: number };
  boardSubjectName: { id: number };
  isActive?: boolean;
  relatedSubjectSubs?: { boardSubjectName: { id: number } }[];
};

export type UpdateRelatedSubjectMainDtoInput =
  Partial<CreateRelatedSubjectMainDtoInput>;

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

// New: accept DTO-shaped payload and map to model + subs
export async function createRelatedSubjectMainFromDto(
  input: CreateRelatedSubjectMainDtoInput,
): Promise<RelatedSubjectMainDto> {
  // Resolve latest/current academic year id
  const [currentAy] = await db
    .select()
    .from(academicYearModel)
    .where(eq(academicYearModel.isCurrentYear, true));
  const [latestAy] = currentAy
    ? [currentAy]
    : await db
        .select()
        .from(academicYearModel)
        .orderBy(academicYearModel.id)
        .then((rows) => rows.slice(-1));

  // 1) Validate foreign keys exist
  const [[foundPc], [foundSt], [foundBsn]] = await Promise.all([
    db
      .select()
      .from(programCourseModel)
      .where(eq(programCourseModel.id, input.programCourse.id)),
    db
      .select()
      .from(subjectTypeModel)
      .where(eq(subjectTypeModel.id, input.subjectType.id)),
    db
      .select()
      .from(boardSubjectNameModel)
      .where(eq(boardSubjectNameModel.id, input.boardSubjectName.id)),
  ]);
  if (!foundPc) {
    throw new Error(`ProgramCourse not found for id=${input.programCourse.id}`);
  }
  if (!foundSt) {
    throw new Error(`SubjectType not found for id=${input.subjectType.id}`);
  }
  if (!foundBsn) {
    throw new Error(
      `BoardSubjectName not found for id=${input.boardSubjectName.id}`,
    );
  }

  // 2) Check for existing main to prevent duplicates (same AY + PC + ST + Target)
  const [existingMain] = await db
    .select()
    .from(relatedSubjectMainModel)
    .where(
      and(
        eq(relatedSubjectMainModel.programCourseId, input.programCourse.id),
        eq(relatedSubjectMainModel.subjectTypeId, input.subjectType.id),
        eq(
          relatedSubjectMainModel.boardSubjectNameId,
          input.boardSubjectName.id,
        ),
        latestAy?.id
          ? eq(relatedSubjectMainModel.academicYearId, latestAy.id)
          : ne(relatedSubjectMainModel.id, -1 as any),
      ),
    );

  const base: RelatedSubjectMain = {
    programCourseId: input.programCourse.id,
    subjectTypeId: input.subjectType.id,
    boardSubjectNameId: input.boardSubjectName.id,
    isActive: input.isActive ?? true,
    academicYearId: latestAy?.id as any,
  } as RelatedSubjectMain;

  // Use existing main if present, otherwise create new
  const created = existingMain
    ? (await getRelatedSubjectMainById(existingMain.id))!
    : await createRelatedSubjectMain(base);

  if (input.relatedSubjectSubs && input.relatedSubjectSubs.length > 0) {
    // Validate and upsert-only-missing subs
    for (const sub of input.relatedSubjectSubs) {
      const subId = sub?.boardSubjectName?.id;
      if (!subId) continue;
      if (subId === created.boardSubjectName.id) continue; // skip target == alt

      const [[existsBsn], [existingSub]] = await Promise.all([
        db
          .select()
          .from(boardSubjectNameModel)
          .where(eq(boardSubjectNameModel.id, subId)),
        db
          .select()
          .from(relatedSubjectSubModel)
          .where(
            and(
              eq(relatedSubjectSubModel.relatedSubjectMainId, created.id!),
              eq(relatedSubjectSubModel.boardSubjectNameId, subId),
            ),
          ),
      ]);
      if (!existsBsn) continue; // invalid FK -> skip
      if (existingSub) continue; // already present -> skip
      await db
        .insert(relatedSubjectSubModel)
        .values({
          relatedSubjectMainId: created.id!,
          boardSubjectNameId: subId,
        })
        .returning();
    }
  }

  const refreshed = await getRelatedSubjectMainById(created.id!);
  if (!refreshed) throw new Error("Failed to create related subject main");
  return refreshed;
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

export async function getRelatedSubjectMainsPaginated(options: {
  page: number;
  pageSize: number;
  search?: string;
  programCourse?: string; // name
  subjectType?: string; // code or name
}): Promise<PaginatedResponse<RelatedSubjectMainDto>> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize || 10));
  const offset = (page - 1) * pageSize;

  const base = db
    .select({
      id: relatedSubjectMainModel.id,
      programCourseId: relatedSubjectMainModel.programCourseId,
      subjectTypeId: relatedSubjectMainModel.subjectTypeId,
      boardSubjectNameId: relatedSubjectMainModel.boardSubjectNameId,
      isActive: relatedSubjectMainModel.isActive,
      createdAt: relatedSubjectMainModel.createdAt,
      updatedAt: relatedSubjectMainModel.updatedAt,
      pcName: programCourseModel.name,
      stCode: subjectTypeModel.code,
      stName: subjectTypeModel.name,
      bsnName: boardSubjectNameModel.name,
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

  const filters: any[] = [];
  const q = (options.search || "").trim();
  if (q) {
    filters.push(ilike(boardSubjectNameModel.name, `%${q}%`));
  }
  if (options.programCourse) {
    filters.push(ilike(programCourseModel.name, `%${options.programCourse}%`));
  }
  if (options.subjectType) {
    filters.push(ilike(subjectTypeModel.code, `%${options.subjectType}%`));
  }

  const rows = await base
    .where(filters.length ? and(...filters) : (undefined as any))
    .limit(pageSize)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: countDistinct(relatedSubjectMainModel.id).as("count") })
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
    .where(filters.length ? and(...filters) : (undefined as any));

  const full = await Promise.all(
    rows.map((r) => getRelatedSubjectMainById(r.id as number)),
  );
  const content = full.filter(Boolean) as RelatedSubjectMainDto[];
  const totalElements = Number(count || 0);
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  return { content, page, pageSize, totalPages, totalElements };
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
  data: Partial<RelatedSubjectMainDto>,
): Promise<RelatedSubjectMainDto> {
  console.log("updateRelatedSubjectMain", id, data);
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

// New: DTO-based update. Only updates main fields; subs should be handled in sub-service or separately
export async function updateRelatedSubjectMainFromDto(
  id: number,
  input: RelatedSubjectMainDto,
): Promise<RelatedSubjectMainDto> {
  // Debug: log incoming DTO payload essentials
  // eslint-disable-next-line no-console
  console.log("[updateRelatedSubjectMainFromDto] id=", id, {
    pcId: input.programCourse?.id,
    stId: input.subjectType?.id,
    bsnId: input.boardSubjectName?.id,
    subs: Array.isArray(input.relatedSubjectSubs)
      ? input.relatedSubjectSubs.map((s) => s.boardSubjectName?.id)
      : null,
  });
  // 1) Update main fields if provided
  const partial: Partial<RelatedSubjectMain> = {};
  if (input.programCourse?.id) partial.programCourseId = input.programCourse.id;
  if (input.subjectType?.id) partial.subjectTypeId = input.subjectType.id;
  if (input.boardSubjectName?.id)
    partial.boardSubjectNameId = input.boardSubjectName.id;
  if (typeof input.isActive === "boolean") partial.isActive = input.isActive;
  if (Object.keys(partial).length > 0) {
    await updateRelatedSubjectMain(id, partial);
  }

  // 2) Reconcile subs when provided on DTO: add missing, delete extras
  if (Array.isArray(input.relatedSubjectSubs)) {
    // Fetch current subs for this main
    const currentSubs = await db
      .select({
        id: relatedSubjectSubModel.id,
        boardSubjectNameId: relatedSubjectSubModel.boardSubjectNameId,
      })
      .from(relatedSubjectSubModel)
      .where(eq(relatedSubjectSubModel.relatedSubjectMainId, id));

    const currentIds = new Set(currentSubs.map((s) => s.boardSubjectNameId));
    const desiredIds = new Set(
      input.relatedSubjectSubs
        .map((s) => s.boardSubjectName?.id)
        .filter((v): v is number => !!v),
    );

    // Add any desired that are missing (skip when equals target id)
    const targetId: number | undefined =
      input.boardSubjectName?.id ?? undefined;
    for (const desiredId of desiredIds) {
      if (desiredId === targetId) continue;
      if (!currentIds.has(desiredId)) {
        await db
          .insert(relatedSubjectSubModel)
          .values({ relatedSubjectMainId: id, boardSubjectNameId: desiredId });
      }
    }

    // Delete any current that are no longer desired
    for (const s of currentSubs) {
      const sBsnId = s.boardSubjectNameId;
      if (
        typeof s.id === "number" &&
        typeof sBsnId === "number" &&
        !desiredIds.has(sBsnId)
      ) {
        await db
          .delete(relatedSubjectSubModel)
          .where(eq(relatedSubjectSubModel.id, s.id));
      }
    }
  }

  // 3) Return refreshed DTO
  const result = await getRelatedSubjectMainById(id);
  if (!result)
    throw new Error("Failed to retrieve updated related subject main");
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
