import { db } from "@/db/index.js";
import { and, eq, inArray } from "drizzle-orm";
import { boardSubjectUnivSubjectMappingModel } from "@repo/db/schemas/models/admissions/board-subject-univ-subject-mapping.model";
import { subjectModel } from "@repo/db/schemas/models/course-design";
import {
  boardSubjectModel,
  boardSubjectNameModel,
} from "@repo/db/schemas/models/admissions";
import { boardModel } from "@repo/db/schemas/models/resources";
import type { BoardSubjectUnivSubjectMappingDto } from "@repo/db/dtos/admissions";

type MappingInsert = typeof boardSubjectUnivSubjectMappingModel.$inferInsert;

// Create mappings from a DTO: expects subject.id and boardSubjects[].id present
export async function createMapping(
  dto: BoardSubjectUnivSubjectMappingDto,
): Promise<BoardSubjectUnivSubjectMappingDto> {
  if (
    !dto.subject?.id ||
    !dto.boardSubjects ||
    dto.boardSubjects.length === 0
  ) {
    throw new Error(
      "Invalid mapping DTO: subject.id and boardSubjects[].id are required",
    );
  }
  const subjectId = dto.subject.id as number;
  // Deduplicate incoming boardSubject ids
  const uniqueBoardSubjectIds = Array.from(
    new Set(
      dto.boardSubjects.filter((bs) => !!bs?.id).map((bs) => bs.id as number),
    ),
  );
  const rows: MappingInsert[] = uniqueBoardSubjectIds.map((id) => ({
    subjectId,
    boardSubjectId: id,
  }));

  if (rows.length === 0) {
    throw new Error("No valid boardSubjects provided");
  }

  // Check for existing duplicates for this subject
  const existing = await db
    .select({
      id: boardSubjectUnivSubjectMappingModel.id,
      boardSubjectId: boardSubjectUnivSubjectMappingModel.boardSubjectId,
    })
    .from(boardSubjectUnivSubjectMappingModel)
    .where(
      and(
        eq(boardSubjectUnivSubjectMappingModel.subjectId, subjectId),
        inArray(
          boardSubjectUnivSubjectMappingModel.boardSubjectId,
          uniqueBoardSubjectIds,
        ),
      ),
    );
  if (existing.length > 0) {
    const dupIds = existing.map((r) => r.boardSubjectId).join(", ");
    throw new Error(
      `Duplicate mapping(s) exist for subjectId=${subjectId} and boardSubjectId(s)=[${dupIds}]`,
    );
  }

  await db.insert(boardSubjectUnivSubjectMappingModel).values(rows).returning();

  // Return aggregated DTO for this subject
  const list = await listMappingsBySubject(subjectId);
  return list;
}

export async function getMappingById(
  id: number,
): Promise<BoardSubjectUnivSubjectMappingDto | null> {
  const rows = await db
    .select({
      id: boardSubjectUnivSubjectMappingModel.id,
      subjectId: boardSubjectUnivSubjectMappingModel.subjectId,
      boardSubjectId: boardSubjectUnivSubjectMappingModel.boardSubjectId,
    })
    .from(boardSubjectUnivSubjectMappingModel)
    .where(eq(boardSubjectUnivSubjectMappingModel.id, id));

  if (rows.length === 0) return null;

  const row = rows[0];
  return assembleDto(row.subjectId!, [row.boardSubjectId!], row.id);
}

export async function listMappings(): Promise<
  BoardSubjectUnivSubjectMappingDto[]
> {
  const rows = await db
    .select({
      id: boardSubjectUnivSubjectMappingModel.id,
      subjectId: boardSubjectUnivSubjectMappingModel.subjectId,
      boardSubjectId: boardSubjectUnivSubjectMappingModel.boardSubjectId,
    })
    .from(boardSubjectUnivSubjectMappingModel);

  // Aggregate board subjects per subject
  const map = new Map<number, { ids: number[]; mappingId: number }>();
  for (const r of rows) {
    const key = r.subjectId!;
    if (!map.has(key)) {
      map.set(key, { ids: [], mappingId: r.id });
    }
    map.get(key)!.ids.push(r.boardSubjectId!);
  }

  const dtos: BoardSubjectUnivSubjectMappingDto[] = [];
  for (const [sid, { ids, mappingId }] of map.entries()) {
    dtos.push(await assembleDto(sid, ids, mappingId));
  }
  return dtos;
}

// Replace all mappings for a subject with the DTO's boardSubjects
export async function updateMapping(
  subjectId: number,
  dto: BoardSubjectUnivSubjectMappingDto,
): Promise<BoardSubjectUnivSubjectMappingDto | null> {
  const sid = dto.subject?.id ?? subjectId;
  if (!sid) return null;

  // delete existing for subject
  await db
    .delete(boardSubjectUnivSubjectMappingModel)
    .where(eq(boardSubjectUnivSubjectMappingModel.subjectId, sid));

  if (dto.boardSubjects && dto.boardSubjects.length > 0) {
    // Deduplicate incoming boardSubject ids for this update
    const uniqueIds = Array.from(
      new Set(
        dto.boardSubjects.filter((bs) => !!bs?.id).map((bs) => bs.id as number),
      ),
    );
    const rows: MappingInsert[] = uniqueIds.map((id) => ({
      subjectId: sid,
      boardSubjectId: id,
    }));
    await db.insert(boardSubjectUnivSubjectMappingModel).values(rows);
  }

  return listMappingsBySubject(sid);
}

export async function deleteMapping(id: number) {
  // get subjectId first
  const [current] = await db
    .select()
    .from(boardSubjectUnivSubjectMappingModel)
    .where(eq(boardSubjectUnivSubjectMappingModel.id, id));

  const [deleted] = await db
    .delete(boardSubjectUnivSubjectMappingModel)
    .where(eq(boardSubjectUnivSubjectMappingModel.id, id))
    .returning();
  if (!deleted) return null as any;
  // return remaining aggregate for that subject
  return current?.subjectId ? listMappingsBySubject(current.subjectId) : null;
}

// helper: aggregate mappings for a single subject
async function listMappingsBySubject(
  subjectId: number,
): Promise<BoardSubjectUnivSubjectMappingDto> {
  const rows = await db
    .select({
      id: boardSubjectUnivSubjectMappingModel.id,
      boardSubjectId: boardSubjectUnivSubjectMappingModel.boardSubjectId,
    })
    .from(boardSubjectUnivSubjectMappingModel)
    .where(eq(boardSubjectUnivSubjectMappingModel.subjectId, subjectId));

  const ids = rows.map((r) => r.boardSubjectId!).filter(Boolean);
  return assembleDto(subjectId, ids, rows[0]?.id ?? 0);
}

async function assembleDto(
  subjectId: number,
  boardSubjectIds: number[],
  mappingId: number,
): Promise<BoardSubjectUnivSubjectMappingDto> {
  const [subject] = await db
    .select()
    .from(subjectModel)
    .where(eq(subjectModel.id, subjectId));

  const boardSubjects: any[] = [];
  for (const bsId of boardSubjectIds) {
    const [bs] = await db
      .select()
      .from(boardSubjectModel)
      .where(eq(boardSubjectModel.id, bsId));
    if (!bs) continue;
    const [board] = await db
      .select()
      .from(boardModel)
      .where(eq(boardModel.id, bs.boardId));
    const [bsn] = await db
      .select()
      .from(boardSubjectNameModel)
      .where(eq(boardSubjectNameModel.id, bs.boardSubjectNameId));
    boardSubjects.push({
      id: bs.id,
      board,
      boardSubjectName: bsn,
      legacyBoardSubjectMappingSubId: bs.legacyBoardSubjectMappingSubId,
      boardId: bs.boardId,
      boardSubjectNameId: bs.boardSubjectNameId,
      fullMarksTheory: bs.fullMarksTheory,
      passingMarksTheory: bs.passingMarksTheory,
      fullMarksPractical: bs.fullMarksPractical,
      passingMarksPractical: bs.passingMarksPractical,
      isActive: bs.isActive,
      createdAt: bs.createdAt,
      updatedAt: bs.updatedAt,
    });
  }

  return {
    id: mappingId,
    subject: subject as any,
    boardSubjects: boardSubjects as any,
  };
}
