import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUploadConfig,
  FileTypeConfigs,
  getSignedUrlForFile,
  uploadToS3,
} from "@/services/s3.service.js";
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024,
  },
});

export const uploadEvidenceDocFileMiddleware = upload.single("file");

const actorUserId = (req: Request): number | null => {
  const u = req.user as { id?: number } | undefined;
  return typeof u?.id === "number" && !Number.isNaN(u.id) ? u.id : null;
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

const uploadEvidenceFile = async (file: Express.Multer.File) => {
  const uploaded = await uploadToS3(
    file,
    createUploadConfig("library/evidence-docs", {
      allowedMimeTypes: FileTypeConfigs.DOCUMENTS,
      maxFileSizeMB: 50,
      makePublic: false,
    }),
  );
  return {
    fileKey: uploaded.key,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
  };
};

export const createEvidenceDocController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const upsert = bodyToUpsert(req.body as Record<string, unknown>);
    if (req.file) {
      const fileMeta = await uploadEvidenceFile(req.file);
      upsert.fileKey = fileMeta.fileKey;
      upsert.mimeType = fileMeta.mimeType;
      upsert.fileSizeBytes = fileMeta.fileSizeBytes;
    }
    if (upsert.uploadedByUserId == null) {
      upsert.uploadedByUserId = actorUserId(req);
    }
    const id = await createEvidenceDoc(upsert);
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
    const upsert = bodyToUpsert(req.body as Record<string, unknown>);
    if (req.file) {
      const fileMeta = await uploadEvidenceFile(req.file);
      upsert.fileKey = fileMeta.fileKey;
      upsert.mimeType = fileMeta.mimeType;
      upsert.fileSizeBytes = fileMeta.fileSizeBytes;
    } else if (!upsert.fileKey) {
      const existing = await getEvidenceDocById(id);
      if (existing?.fileKey) {
        upsert.fileKey = existing.fileKey;
        upsert.mimeType = upsert.mimeType ?? existing.mimeType ?? null;
        upsert.fileSizeBytes =
          upsert.fileSizeBytes ?? existing.fileSizeBytes ?? null;
      }
    }
    await updateEvidenceDoc(id, upsert);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Evidence doc updated."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getEvidenceDocPresignedUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const row = await getEvidenceDocById(id);
    if (!row) throw new ApiError(404, "Evidence doc not found.");
    if (!row.fileKey)
      throw new ApiError(404, "Evidence doc has no file attached.");
    const url = await getSignedUrlForFile(row.fileKey, 60 * 10);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", { url }, "Signed URL generated."));
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
