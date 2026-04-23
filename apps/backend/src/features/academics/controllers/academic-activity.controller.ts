import { NextFunction, Request, Response } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { ApiResponse, handleError } from "@/utils/index.js";
import { db } from "@/db/index.js";
import { socketService } from "@/services/socketService.js";
import { v4 as uuidv4 } from "uuid";
import { feeStudentMappingModel } from "@repo/db/schemas/models/fees/fees-student-mapping.model.js";
import { feeStructureModel } from "@repo/db/schemas/models/fees/fee-structure.model.js";
import { studentModel } from "@repo/db/schemas/models/user/student.model.js";
import {
  getAcademicActivityById,
  createAcademicActivity,
  deleteAcademicActivity,
  getAllAcademicActivities,
  updateAcademicActivity,
  upsertAcademicActivities,
  upsertAcademicActivity,
  validateScopeReferences,
} from "../services/academic-activity.service.js";

function getRequestUserId(req: Request): number | undefined {
  const userId = (req.user as any)?.id;
  return typeof userId === "number" ? userId : undefined;
}

function normalizePayload(raw: any) {
  const hasClassIds =
    raw && Object.prototype.hasOwnProperty.call(raw, "classIds");
  const hasProgramCourseIds =
    raw && Object.prototype.hasOwnProperty.call(raw, "programCourseIds");

  const parseDate = (value: unknown): Date | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    if (value instanceof Date) return value;
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) {
      throw new Error(`Invalid date value: ${String(value)}`);
    }
    return d;
  };

  return {
    ...raw,
    startDate: parseDate(raw?.startDate),
    endDate: parseDate(raw?.endDate),
    classIds: hasClassIds
      ? Array.isArray(raw?.classIds)
        ? raw.classIds
        : []
      : undefined,
    programCourseIds: hasProgramCourseIds
      ? Array.isArray(raw?.programCourseIds)
        ? raw.programCourseIds
        : []
      : undefined,
  };
}

function notifyMainConsoleAcademicActivityUpdate(
  req: Request,
  activityName: string,
) {
  const actor = (req.user as any)?.name || "Unknown User";
  socketService.sendNotificationToAll({
    id: uuidv4(),
    userId: String((req.user as any)?.id ?? ""),
    userName: actor,
    type: "update",
    message: `updated academic activity "${activityName}"`,
    createdAt: new Date(),
    read: false,
    meta: {
      itemType: "Academic Activity",
      itemName: activityName,
      timestamp: new Date().toISOString(),
    },
  });
}

async function notifyStudentConsoleFeeActivityUpdate(
  activityId: number,
  activityName: string,
) {
  if (activityName.trim().toLowerCase() !== "semester fee payment") return;
  const activity = await getAcademicActivityById(activityId);
  if (!activity) return;
  const io = socketService.getIO();
  if (!io) return;

  const classIds = (activity.classes ?? [])
    .map((c) => c?.class?.id)
    .filter((id): id is number => typeof id === "number");
  const programCourseIds = (activity.programCourses ?? [])
    .map((p) => p?.programCourse?.id)
    .filter((id): id is number => typeof id === "number");

  const conditions = [];
  if (classIds.length > 0) {
    conditions.push(inArray(feeStructureModel.classId, classIds));
  }
  if (programCourseIds.length > 0) {
    conditions.push(
      inArray(feeStructureModel.programCourseId, programCourseIds),
    );
  }

  const rows = await db
    .selectDistinct({ userId: studentModel.userId })
    .from(feeStudentMappingModel)
    .innerJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .innerJoin(
      studentModel,
      eq(studentModel.id, feeStudentMappingModel.studentId),
    )
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  rows.forEach((row) => {
    if (!row.userId) return;
    io.to(`user:${row.userId}`).emit(
      "academic_activity_student_console_updated",
      {
        activityId,
        activityName,
        timestamp: new Date().toISOString(),
      },
    );
  });
}

async function ensureScopeReferences(rawPayload: any): Promise<void> {
  const payload = normalizePayload(rawPayload);
  const { missingClassIds, missingProgramCourseIds } =
    await validateScopeReferences(payload.classIds, payload.programCourseIds);

  if (missingClassIds.length > 0 || missingProgramCourseIds.length > 0) {
    const messages: string[] = [];
    if (missingClassIds.length > 0) {
      messages.push(`Invalid classIds: ${missingClassIds.join(", ")}`);
    }
    if (missingProgramCourseIds.length > 0) {
      messages.push(
        `Invalid programCourseIds: ${missingProgramCourseIds.join(", ")}`,
      );
    }
    throw new Error(messages.join(" | "));
  }
}

export async function getAllAcademicActivitiesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const activities = await getAllAcademicActivities();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          activities,
          "Academic activities fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getAcademicActivityByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const activity = await getAcademicActivityById(id);
    if (!activity) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Academic activity not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          activity,
          "Academic activity fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createAcademicActivityController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getRequestUserId(req);
    await ensureScopeReferences(req.body);
    const created = await createAcademicActivity(
      normalizePayload(req.body),
      userId,
    );
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Academic activity created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateAcademicActivityController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const userId = getRequestUserId(req);
    await ensureScopeReferences(req.body);
    const updated = await updateAcademicActivity(
      id,
      normalizePayload(req.body),
      userId,
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Academic activity not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Academic activity updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteAcademicActivityController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteAcademicActivity(id);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Academic activity not found",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Academic activity deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function upsertAcademicActivityController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getRequestUserId(req);
    await ensureScopeReferences(req.body);
    const data = await upsertAcademicActivity(
      normalizePayload(req.body),
      userId,
    );
    notifyMainConsoleAcademicActivityUpdate(req, data.name);
    if (typeof data.id === "number") {
      await notifyStudentConsoleFeeActivityUpdate(data.id, data.name);
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          data,
          "Academic activity upserted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function upsertManyAcademicActivitiesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = getRequestUserId(req);
    const payloads = Array.isArray(req.body) ? req.body : req.body?.activities;
    if (!Array.isArray(payloads)) {
      throw new Error("Payload must be an array or { activities: [] }");
    }

    for (const payload of payloads) {
      await ensureScopeReferences(payload);
    }

    const data = await upsertAcademicActivities(
      payloads.map(normalizePayload),
      userId,
    );
    for (const activity of data) {
      notifyMainConsoleAcademicActivityUpdate(req, activity.name);
      if (typeof activity.id === "number") {
        await notifyStudentConsoleFeeActivityUpdate(activity.id, activity.name);
      }
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          data,
          "Academic activities upserted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
