import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  subjectSelectionMetaStreamModel,
  subjectSelectionMetaModel,
} from "@repo/db/schemas/models/subject-selection";
import { streamModel } from "@repo/db/schemas/models/course-design";
import { SubjectSelectionMetaStreamDto } from "@repo/db/dtos/subject-selection";

// Use DTOs only for service I/O types per requirement

export interface CreateSubjectSelectionMetaStreamInput {
  subjectSelectionMetaId: number;
  stream: { id: number };
}

type SubjectSelectionMetaStreamRow =
  typeof subjectSelectionMetaStreamModel.$inferSelect;
type StreamRow = typeof streamModel.$inferSelect;

export async function toDto(
  row: SubjectSelectionMetaStreamRow,
): Promise<SubjectSelectionMetaStreamDto> {
  const [stream] = await db
    .select()
    .from(streamModel)
    .where(eq(streamModel.id, row.streamId));
  return {
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    stream: stream as unknown as SubjectSelectionMetaStreamDto["stream"],
  };
}

export async function findById(
  id: number,
): Promise<SubjectSelectionMetaStreamDto | null> {
  const [row] = await db
    .select()
    .from(subjectSelectionMetaStreamModel)
    .where(eq(subjectSelectionMetaStreamModel.id, id));
  if (!row) return null;
  return await toDto(row as SubjectSelectionMetaStreamRow);
}

export async function findAll(): Promise<SubjectSelectionMetaStreamDto[]> {
  const rows = await db.select().from(subjectSelectionMetaStreamModel);
  const out: SubjectSelectionMetaStreamDto[] = [];
  for (const r of rows)
    out.push(await toDto(r as SubjectSelectionMetaStreamRow));
  return out;
}

export async function createFromDto(
  input: CreateSubjectSelectionMetaStreamInput,
): Promise<SubjectSelectionMetaStreamDto | null> {
  const [[meta], [stream]] = await Promise.all([
    db
      .select()
      .from(subjectSelectionMetaModel)
      .where(eq(subjectSelectionMetaModel.id, input.subjectSelectionMetaId)),
    db.select().from(streamModel).where(eq(streamModel.id, input.stream.id)),
  ]);
  if (!meta || !stream) {
    return null;
  }

  const [created] = await db
    .insert(subjectSelectionMetaStreamModel)
    .values({
      subjectSelectionMetaId: input.subjectSelectionMetaId,
      streamId: input.stream.id,
    })
    .returning();
  const createdRow = created as SubjectSelectionMetaStreamRow;
  const dto = await findById(createdRow.id as number);
  return dto;
}

export interface UpdateSubjectSelectionMetaStreamInput {
  subjectSelectionMetaId?: number;
  stream?: { id: number };
}

export async function updateFromDto(
  id: number,
  input: UpdateSubjectSelectionMetaStreamInput,
): Promise<SubjectSelectionMetaStreamDto | null> {
  type SubjectSelectionMetaStreamInsert =
    typeof subjectSelectionMetaStreamModel.$inferInsert;
  const partial: Partial<SubjectSelectionMetaStreamInsert> = {};
  if (typeof input.subjectSelectionMetaId === "number") {
    const [meta] = await db
      .select()
      .from(subjectSelectionMetaModel)
      .where(eq(subjectSelectionMetaModel.id, input.subjectSelectionMetaId));
    if (!meta) {
      return null;
    }
    partial.subjectSelectionMetaId = input.subjectSelectionMetaId as number;
  }
  if (typeof input.stream?.id === "number") {
    const [stream] = await db
      .select()
      .from(streamModel)
      .where(eq(streamModel.id, input.stream.id));
    if (!stream) {
      return null;
    }
    partial.streamId = input.stream.id as number;
  }
  if (Object.keys(partial).length > 0) {
    await db
      .update(subjectSelectionMetaStreamModel)
      .set(partial)
      .where(eq(subjectSelectionMetaStreamModel.id, id));
  }
  const dto = await findById(id);
  return dto;
}

export async function remove(
  id: number,
): Promise<SubjectSelectionMetaStreamDto | null> {
  const [deleted] = await db
    .delete(subjectSelectionMetaStreamModel)
    .where(eq(subjectSelectionMetaStreamModel.id, id))
    .returning();
  if (!deleted) return null;
  return await toDto(deleted as SubjectSelectionMetaStreamRow);
}
