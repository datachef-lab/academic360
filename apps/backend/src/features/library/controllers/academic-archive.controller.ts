import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createArchive,
  deleteArchive,
  findArchivesPaginated,
  getArchiveById,
  updateArchive,
} from "@/features/library/services/academic-archive.service.js";

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

export const listArchives = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const result = await findArchivesPaginated({
      page: Number.isNaN(page) || page < 1 ? 1 : page,
      limit: Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 100),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      archiveType:
        typeof req.query.archiveType === "string"
          ? req.query.archiveType
          : undefined,
      programCourseId: optId(req.query.programCourseId) ?? undefined,
      classId: optId(req.query.classId) ?? undefined,
      year: optId(req.query.year) ?? undefined,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Archives fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getArchive = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const row = await getArchiveById(id);
    if (!row) throw new ApiError(404, "Archive not found.");
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Archive fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

const bodyToUpsert = (b: Record<string, unknown>) => ({
  archiveType: typeof b.archiveType === "string" ? b.archiveType : "",
  title: typeof b.title === "string" ? b.title : "",
  description: typeof b.description === "string" ? b.description : null,
  programCourseId: optId(b.programCourseId),
  classId: optId(b.classId),
  year: optId(b.year),
  fileKey: typeof b.fileKey === "string" ? b.fileKey : "",
  mimeType: typeof b.mimeType === "string" ? b.mimeType : null,
  fileSizeBytes:
    typeof b.fileSizeBytes === "number"
      ? b.fileSizeBytes
      : optId(b.fileSizeBytes),
  tags: typeof b.tags === "string" ? b.tags : null,
  uploadedByUserId: optId(b.uploadedByUserId),
});

export const createArchiveController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = await createArchive(
      bodyToUpsert(req.body as Record<string, unknown>),
    );
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Archive created."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const updateArchiveController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await updateArchive(id, bodyToUpsert(req.body as Record<string, unknown>));
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Archive updated."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const deleteArchiveController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await deleteArchive(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Archive deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
};
