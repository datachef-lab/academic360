import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import {
  getAcademicActivityById,
  createAcademicActivity,
  deleteAcademicActivity,
  getAllAcademicActivities,
  updateAcademicActivity,
  validateScopeReferences,
  CreateAcademicActivityPayload,
  UpdateAcademicActivityPayload,
  CreateScopePayload,
} from "../services/academic-activity.service.js";

function getRequestUserId(req: Request): number | undefined {
  const userId = (req.user as any)?.id;
  return typeof userId === "number" ? userId : undefined;
}

function parseScopesFromBody(body: any): CreateScopePayload[] | undefined {
  if (!body?.scopes) return undefined;
  if (!Array.isArray(body.scopes)) return [];
  return body.scopes.map((s: any) => ({
    streamId: Number(s.streamId),
    classId: Number(s.classId),
    startDate: s.startDate ?? null,
    endDate: s.endDate ?? null,
    isEnabled: s.isEnabled ?? true,
  }));
}

async function ensureScopeReferences(
  scopes?: CreateScopePayload[],
): Promise<void> {
  if (!scopes?.length) return;
  const { missingStreamIds, missingClassIds } =
    await validateScopeReferences(scopes);

  if (missingStreamIds.length > 0 || missingClassIds.length > 0) {
    const messages: string[] = [];
    if (missingStreamIds.length > 0) {
      messages.push(`Invalid streamIds: ${missingStreamIds.join(", ")}`);
    }
    if (missingClassIds.length > 0) {
      messages.push(`Invalid classIds: ${missingClassIds.join(", ")}`);
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
    const scopes = parseScopesFromBody(req.body);
    await ensureScopeReferences(scopes);

    const payload: CreateAcademicActivityPayload = {
      academicYearId: Number(req.body.academicYearId),
      academicActivityMasterId: Number(req.body.academicActivityMasterId),
      audience: req.body.audience ?? "ALL",
      affiliationId: Number(req.body.affiliationId),
      regulationTypeId: Number(req.body.regulationTypeId),
      appearTypeId: Number(req.body.appearTypeId),
      scopes,
    };

    const created = await createAcademicActivity(payload, userId);
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
    const scopes = parseScopesFromBody(req.body);
    await ensureScopeReferences(scopes);

    const payload: UpdateAcademicActivityPayload = {
      ...req.body,
      scopes,
    };

    const updated = await updateAcademicActivity(id, payload, userId);
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
