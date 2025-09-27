import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  subjectSelectionMetaClassModel,
  subjectSelectionMetaModel,
} from "@repo/db/schemas/models/subject-selection";
import { classModel } from "@repo/db/schemas/models/academics";
import { SubjectSelectionMetaClassDto } from "@repo/db/dtos/subject-selection";

// Use DTOs only for service I/O types per requirement

export interface CreateSubjectSelectionMetaClassInput {
  subjectSelectionMetaId: number;
  class: { id: number };
}

type SubjectSelectionMetaClassRow =
  typeof subjectSelectionMetaClassModel.$inferSelect;
type ClassRow = typeof classModel.$inferSelect;

export async function toDto(
  row: SubjectSelectionMetaClassRow,
): Promise<SubjectSelectionMetaClassDto> {
  const [klass] = await db
    .select()
    .from(classModel)
    .where(eq(classModel.id, row.classId));
  return {
    id: row.id,
    subjectSelectionMetaId: row.subjectSelectionMetaId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    class: klass as SubjectSelectionMetaClassDto["class"],
  };
}

export async function findById(
  id: number,
): Promise<SubjectSelectionMetaClassDto | null> {
  const [row] = await db
    .select()
    .from(subjectSelectionMetaClassModel)
    .where(eq(subjectSelectionMetaClassModel.id, id));
  if (!row) return null;
  return await toDto(row as SubjectSelectionMetaClassRow);
}

export async function findAll(): Promise<SubjectSelectionMetaClassDto[]> {
  const rows = await db.select().from(subjectSelectionMetaClassModel);
  const out: SubjectSelectionMetaClassDto[] = [];
  for (const r of rows)
    out.push(await toDto(r as SubjectSelectionMetaClassRow));
  return out;
}

export async function createFromDto(
  input: CreateSubjectSelectionMetaClassInput,
): Promise<SubjectSelectionMetaClassDto | null> {
  const [[meta], [klass]] = await Promise.all([
    db
      .select()
      .from(subjectSelectionMetaModel)
      .where(eq(subjectSelectionMetaModel.id, input.subjectSelectionMetaId)),
    db.select().from(classModel).where(eq(classModel.id, input.class.id)),
  ]);
  if (!meta || !klass) {
    return null;
  }

  const [created] = await db
    .insert(subjectSelectionMetaClassModel)
    .values({
      subjectSelectionMetaId: input.subjectSelectionMetaId,
      classId: input.class.id,
    })
    .returning();
  const createdRow = created as SubjectSelectionMetaClassRow;
  const dto = await findById(createdRow.id as number);
  return dto;
}

export interface UpdateSubjectSelectionMetaClassInput {
  subjectSelectionMetaId?: number;
  class?: { id: number };
}

export async function updateFromDto(
  id: number,
  input: UpdateSubjectSelectionMetaClassInput,
): Promise<SubjectSelectionMetaClassDto | null> {
  type SubjectSelectionMetaClassInsert =
    typeof subjectSelectionMetaClassModel.$inferInsert;
  const partial: Partial<SubjectSelectionMetaClassInsert> = {};
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
  if (typeof input.class?.id === "number") {
    const [klass] = await db
      .select()
      .from(classModel)
      .where(eq(classModel.id, input.class.id));
    if (!klass) {
      return null;
    }
    partial.classId = input.class.id as number;
  }
  if (Object.keys(partial).length > 0) {
    await db
      .update(subjectSelectionMetaClassModel)
      .set(partial)
      .where(eq(subjectSelectionMetaClassModel.id, id));
  }
  const dto = await findById(id);
  return dto;
}

export async function remove(
  id: number,
): Promise<SubjectSelectionMetaClassDto | null> {
  const [deleted] = await db
    .delete(subjectSelectionMetaClassModel)
    .where(eq(subjectSelectionMetaClassModel.id, id))
    .returning();
  if (!deleted) return null;
  return await toDto(deleted as SubjectSelectionMetaClassRow);
}
