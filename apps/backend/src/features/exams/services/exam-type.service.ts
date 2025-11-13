import { db } from "@/db/index.js";
import {
  ExamType,
  ExamTypeT,
  examTypeModel,
} from "@repo/db/schemas/models/exams";
import { and, eq, ilike, ne } from "drizzle-orm";

function normaliseExamTypePayload<T extends Partial<ExamType | ExamTypeT>>(
  data: T,
) {
  const clone = { ...data };
  if (clone.name && typeof clone.name === "string") {
    clone.name = clone.name.trim() as T["name"];
  }
  if (
    clone.shortName !== undefined &&
    typeof clone.shortName === "string" &&
    clone.shortName !== null
  ) {
    clone.shortName = clone.shortName.trim() as T["shortName"];
  }
  if (
    clone.description !== undefined &&
    typeof clone.description === "string" &&
    clone.description !== null
  ) {
    clone.description = clone.description.trim() as T["description"];
  }
  if (
    clone.carry !== undefined &&
    typeof clone.carry === "string" &&
    clone.carry !== null
  ) {
    clone.carry = clone.carry.trim() as T["carry"];
  }
  return clone;
}

async function ensureUniqueName(
  name: string,
  excludeId?: number,
): Promise<boolean> {
  const trimmedName = name.trim();
  const whereClause =
    excludeId !== undefined
      ? and(
          ilike(examTypeModel.name, trimmedName),
          ne(examTypeModel.id, excludeId),
        )
      : ilike(examTypeModel.name, trimmedName);

  const [existing] = await db.select().from(examTypeModel).where(whereClause);
  return Boolean(existing);
}

async function ensureUniqueSequence(
  sequence: number | null | undefined,
  excludeId?: number,
): Promise<boolean> {
  if (sequence === undefined || sequence === null) return false;
  const whereClause =
    excludeId !== undefined
      ? and(
          eq(examTypeModel.sequence, sequence),
          ne(examTypeModel.id, excludeId),
        )
      : eq(examTypeModel.sequence, sequence);
  const [existing] = await db.select().from(examTypeModel).where(whereClause);
  return Boolean(existing);
}

export async function createExamType(data: ExamType) {
  const { id, createdAt, updatedAt, ...rest } = data as ExamTypeT;
  const payload = normaliseExamTypePayload(rest);

  if (!payload.name) {
    throw new Error("Exam type name is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("Exam type name already exists.");
  }

  if (await ensureUniqueSequence(payload.sequence ?? null)) {
    throw new Error("Sequence must be unique.");
  }

  const [created] = await db.insert(examTypeModel).values(payload).returning();
  return created;
}

export async function getAllExamTypes() {
  return db.select().from(examTypeModel);
}

export async function findExamTypeById(id: number) {
  const [examType] = await db
    .select()
    .from(examTypeModel)
    .where(eq(examTypeModel.id, id));
  return examType ?? null;
}

export async function updateExamType(
  id: number,
  data: Partial<ExamTypeT> | Partial<ExamType>,
) {
  const { id: _, createdAt, updatedAt, ...rest } = data as Partial<ExamTypeT>;
  const payload = normaliseExamTypePayload(rest);

  if (payload.name && (await ensureUniqueName(payload.name, id))) {
    throw new Error("Exam type name already exists.");
  }

  if (
    payload.sequence !== undefined &&
    (await ensureUniqueSequence(payload.sequence, id))
  ) {
    throw new Error("Sequence must be unique.");
  }

  const [updated] = await db
    .update(examTypeModel)
    .set(payload)
    .where(eq(examTypeModel.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteExamType(id: number) {
  const [deleted] = await db
    .delete(examTypeModel)
    .where(eq(examTypeModel.id, id))
    .returning();
  return deleted ?? null;
}

export async function deleteExamTypeSafe(id: number) {
  const [found] = await db
    .select()
    .from(examTypeModel)
    .where(eq(examTypeModel.id, id));
  if (!found) return null;

  // Check for dependencies - you can add more checks here if exam types have dependencies
  // For now, exam types can be deleted if they exist

  const [deleted] = await db
    .delete(examTypeModel)
    .where(eq(examTypeModel.id, id))
    .returning();

  if (deleted) {
    return {
      success: true,
      message: "Exam type deleted successfully.",
      records: [],
    };
  }

  return {
    success: false,
    message: "Failed to delete exam type.",
    records: [],
  };
}
