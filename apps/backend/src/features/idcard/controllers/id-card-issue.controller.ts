import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { eq } from "drizzle-orm";

import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { db } from "@/db/index.js";
import { idCardIssueModel } from "@repo/db/schemas/index.js";
import { getBufferFromS3 } from "@/services/s3.service.js";
import {
  CreateIssueInput,
  createIssue,
  deleteIssue,
  getIssueById,
  getMostRecentIssueForStudent,
  getStudentIdCardValidity,
  listIssuesPaginated,
} from "@/features/idcard/services/id-card-issue.service.js";
import { syncLegacyIdCards } from "@/features/idcard/services/legacy-idcard-sync.service.js";

const optInt = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const optStatus = (
  v: unknown,
): "ISSUED" | "RENEWED" | "REISSUED" | undefined => {
  if (v === "ISSUED" || v === "RENEWED" || v === "REISSUED") return v;
  return undefined;
};

export const idCardIssueUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
}).fields([
  { name: "frontImage", maxCount: 1 },
  { name: "photoImage", maxCount: 1 },
]);

const bodyToCreate = (b: Record<string, unknown>): CreateIssueInput => ({
  studentId: optInt(b.studentId) ?? 0,
  templateId: optInt(b.templateId) ?? 0,
  issueStatus: optStatus(b.issueStatus),
  renewedFromIssueId: optInt(b.renewedFromIssueId) ?? null,
  rfidNumber: typeof b.rfidNumber === "string" ? b.rfidNumber : null,
  validFrom: typeof b.validFrom === "string" ? b.validFrom : null,
  validTill: typeof b.validTill === "string" ? b.validTill : null,
  nameSnapshot: typeof b.nameSnapshot === "string" ? b.nameSnapshot : null,
  courseSnapshot:
    typeof b.courseSnapshot === "string" ? b.courseSnapshot : null,
  bloodGroupSnapshot:
    typeof b.bloodGroupSnapshot === "string" ? b.bloodGroupSnapshot : null,
  mobileSnapshot:
    typeof b.mobileSnapshot === "string" ? b.mobileSnapshot : null,
  sportsQuotaSnapshot:
    typeof b.sportsQuotaSnapshot === "string" ? b.sportsQuotaSnapshot : null,
  uidSnapshot: typeof b.uidSnapshot === "string" ? b.uidSnapshot : null,
  remarks: typeof b.remarks === "string" ? b.remarks : null,
});

export const listIssuesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = optInt(req.query.page) ?? 1;
    const limit = optInt(req.query.limit) ?? 20;
    const result = await listIssuesPaginated({
      page: page < 1 ? 1 : page,
      limit: limit < 1 ? 20 : Math.min(limit, 100),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      studentId: optInt(req.query.studentId),
      academicYearId: optInt(req.query.academicYearId),
      issueStatus: optStatus(req.query.issueStatus),
      fromDate:
        typeof req.query.fromDate === "string" ? req.query.fromDate : undefined,
      toDate:
        typeof req.query.toDate === "string" ? req.query.toDate : undefined,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Issues fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getIssueController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = optInt(req.params.id);
    if (!id) throw new ApiError(400, "Invalid issue id.");
    const row = await getIssueById(id);
    if (!row) throw new ApiError(404, "Issue not found.");
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Issue fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getMostRecentIssueForStudentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = optInt(req.params.studentId);
    if (!studentId) throw new ApiError(400, "Invalid student id.");
    const row = await getMostRecentIssueForStudent(studentId);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Most recent issue fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const createIssueController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = bodyToCreate(req.body as Record<string, unknown>);
    if (!input.studentId) throw new ApiError(400, "studentId is required.");
    if (!input.templateId) throw new ApiError(400, "templateId is required.");

    const files = (
      req as Request & {
        files?: Record<string, Express.Multer.File[]>;
      }
    ).files;
    const frontImage = files?.frontImage?.[0];
    const photoImage = files?.photoImage?.[0];

    const userId =
      (req as Request & { user?: { id: number } }).user?.id ?? null;
    if (userId != null) input.issuedByUserId = userId;

    const id = await createIssue(input, { frontImage, photoImage });
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Issue created."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getStudentIdCardValidityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = optInt(req.params.studentId);
    if (!studentId) throw new ApiError(400, "Invalid student id.");
    const validity = await getStudentIdCardValidity(studentId);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", validity, "Validity computed."));
  } catch (e) {
    handleError(e, res, next);
  }
};

async function streamIssueImage(
  req: Request,
  res: Response,
  next: NextFunction,
  pick: "front" | "photo",
) {
  try {
    const id = optInt(req.params.id);
    if (!id) throw new ApiError(400, "Invalid issue id.");
    const [row] = await db
      .select({
        front: idCardIssueModel.frontImageKey,
        photo: idCardIssueModel.photoImageKey,
      })
      .from(idCardIssueModel)
      .where(eq(idCardIssueModel.id, id))
      .limit(1);
    const key = pick === "front" ? row?.front : row?.photo;
    if (!key) throw new ApiError(404, `Issue ${pick} image not found.`);
    const buffer = await getBufferFromS3(key);
    if (!buffer) throw new ApiError(502, "Could not fetch issue image.");
    const ext = key.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(buffer);
  } catch (e) {
    handleError(e, res, next);
  }
}

export const streamIssueFrontImageController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => streamIssueImage(req, res, next, "front");

export const streamIssuePhotoImageController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => streamIssueImage(req, res, next, "photo");

export const deleteIssueController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = optInt(req.params.id);
    if (!id) throw new ApiError(400, "Invalid issue id.");
    await deleteIssue(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Issue deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
};

/**
 * Manual trigger for the legacy ID card backfill (snapcard → new DB + S3).
 * Idempotent (legacyIssueId); no-ops if a run is already in progress.
 */
export const runLegacyIdCardSyncController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await syncLegacyIdCards();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Legacy ID card sync completed.",
        ),
      );
  } catch (e) {
    handleError(e, res, next);
  }
};
