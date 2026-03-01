import { db } from "@/db/index.js";
import {
  ExamType,
  ExamTypeT,
  examTypeModel,
} from "@repo/db/schemas/models/exams";
import { and, eq, ilike, ne } from "drizzle-orm";
import { socketService } from "@/services/socketService.js";
import * as userService from "@/features/user/services/user.service.js";

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

export async function createExamType(data: ExamType, userId?: number) {
  const { id, createdAt, updatedAt, ...rest } = data as ExamTypeT;
  const payload = normaliseExamTypePayload(rest);

  if (!payload.name) {
    throw new Error("Exam type name is required.");
  }

  if (await ensureUniqueName(payload.name)) {
    throw new Error("Exam type name already exists.");
  }

  const [created] = await db.insert(examTypeModel).values(payload).returning();
  if (created) {
    const userName =
      userId != null
        ? ((await userService.findById(userId))?.name ?? "Unknown User")
        : "Unknown User";
    socketService.emitToStaffAndAdmin("exam_management_update", {
      entity: "exam_type",
      action: "created",
      entityId: created.id,
      userName,
      performedByUserId: userId ?? null,
      message: "Exam type has been created",
      timestamp: new Date().toISOString(),
    });
    socketService.sendNotificationToStaffAndAdmin({
      id: `exam_type_created_${created.id}_${Date.now()}`,
      type: "info",
      userId: userId?.toString(),
      userName,
      message: `created exam type: ${created.name}`,
      createdAt: new Date(),
      read: false,
      meta: { examTypeId: created.id, entity: "exam_type", action: "created" },
    });
  }
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
  userId?: number,
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
  if (updated) {
    const userName =
      userId != null
        ? ((await userService.findById(userId))?.name ?? "Unknown User")
        : "Unknown User";
    socketService.emitToStaffAndAdmin("exam_management_update", {
      entity: "exam_type",
      action: "updated",
      entityId: id,
      userName,
      performedByUserId: userId ?? null,
      message: "Exam type has been updated",
      timestamp: new Date().toISOString(),
    });
    socketService.sendNotificationToStaffAndAdmin({
      id: `exam_type_updated_${id}_${Date.now()}`,
      type: "update",
      userId: userId?.toString(),
      userName,
      message: `updated exam type: ${updated.name}`,
      createdAt: new Date(),
      read: false,
      meta: { examTypeId: id, entity: "exam_type", action: "updated" },
    });
  }
  return updated ?? null;
}

export async function deleteExamType(id: number) {
  const [deleted] = await db
    .delete(examTypeModel)
    .where(eq(examTypeModel.id, id))
    .returning();
  return deleted ?? null;
}

export async function deleteExamTypeSafe(id: number, userId?: number) {
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
    const userName =
      userId != null
        ? ((await userService.findById(userId))?.name ?? "Unknown User")
        : "Unknown User";
    socketService.emitToStaffAndAdmin("exam_management_update", {
      entity: "exam_type",
      action: "deleted",
      entityId: id,
      userName,
      performedByUserId: userId ?? null,
      message: "Exam type has been deleted",
      timestamp: new Date().toISOString(),
    });
    socketService.sendNotificationToStaffAndAdmin({
      id: `exam_type_deleted_${id}_${Date.now()}`,
      type: "info",
      userId: userId?.toString(),
      userName,
      message: `deleted exam type: ${found.name}`,
      createdAt: new Date(),
      read: false,
      meta: { examTypeId: id, entity: "exam_type", action: "deleted" },
    });
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
