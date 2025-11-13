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

export async function createExamType(data: ExamType) {
  const { id, createdAt, updatedAt, ...rest } = data as ExamTypeT;
  const payload = normaliseExamTypePayload(rest);

  if (!payload.name) {
    throw new Error("Exam type name is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("Exam type name already exists.");
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
