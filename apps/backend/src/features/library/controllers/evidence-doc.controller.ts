import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createEvidenceDoc,
  deleteEvidenceDoc,
  findEvidenceDocsPaginated,
  getEvidenceDocById,
  updateEvidenceDoc,
} from "@/features/library/services/evidence-doc.service.js";

const parseId = (v?: string | string[]): number | null => {
  const input = Array.isArray(v) ? v[0] : v;
  const n = Number(input);
  if (!input || Number.isNaN(n)) return null;
  return n;
};

const optId = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const listEvidenceDocs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const result = await findEvidenceDocsPaginated({
      page: Number.isNaN(page) || page < 1 ? 1 : page,
      limit: Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 100),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      criterionCode:
        typeof req.query.criterionCode === "string"
          ? req.query.criterionCode
          : undefined,
      academicYear:
        typeof req.query.academicYear === "string"
          ? req.query.academicYear
          : undefined,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Evidence docs fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getEvidenceDoc = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const row = await getEvidenceDocById(id);
    if (!row) throw new ApiError(404, "Evidence doc not found.");
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Evidence doc fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

const bodyToUpsert = (b: Record<string, unknown>) => ({
  criterionCode: typeof b.criterionCode === "string" ? b.criterionCode : "",
  title: typeof b.title === "string" ? b.title : "",
  description: typeof b.description === "string" ? b.description : null,
  fileKey: typeof b.fileKey === "string" ? b.fileKey : "",
  mimeType: typeof b.mimeType === "string" ? b.mimeType : null,
  fileSizeBytes:
    typeof b.fileSizeBytes === "number"
      ? b.fileSizeBytes
      : optId(b.fileSizeBytes),
  tags: typeof b.tags === "string" ? b.tags : null,
  academicYear: typeof b.academicYear === "string" ? b.academicYear : null,
  uploadedByUserId: optId(b.uploadedByUserId),
});

export const createEvidenceDocController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = await createEvidenceDoc(
      bodyToUpsert(req.body as Record<string, unknown>),
    );
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Evidence doc created."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const updateEvidenceDocController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await updateEvidenceDoc(
      id,
      bodyToUpsert(req.body as Record<string, unknown>),
    );
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Evidence doc updated."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const deleteEvidenceDocController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await deleteEvidenceDoc(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Evidence doc deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
};
