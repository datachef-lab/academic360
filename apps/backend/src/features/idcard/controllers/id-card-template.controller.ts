import { NextFunction, Request, Response } from "express";
import multer from "multer";

import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { idCardTemplateModel } from "@repo/db/schemas/index.js";
import { getBufferFromS3 } from "@/services/s3.service.js";
import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  listTemplatesPaginated,
  TemplateUpsertInput,
  updateTemplate,
} from "@/features/idcard/services/id-card-template.service.js";

const optInt = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const optBool = (v: unknown): boolean | undefined => {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
};

export const idCardTemplateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
}).fields([
  { name: "templateImage", maxCount: 1 },
  { name: "backsideImage", maxCount: 1 },
]);

const bodyToUpsert = (b: Record<string, unknown>): TemplateUpsertInput => ({
  academicYearId: optInt(b.academicYearId) ?? 0,
  name: typeof b.name === "string" ? b.name : "",
  description: typeof b.description === "string" ? b.description : null,
  canvasWidthPx: optInt(b.canvasWidthPx),
  canvasHeightPx: optInt(b.canvasHeightPx),
  qrcodeSize: optInt(b.qrcodeSize),
  isDefault: optBool(b.isDefault),
  disabled: optBool(b.disabled),
});

export const listTemplatesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = optInt(req.query.page) ?? 1;
    const limit = optInt(req.query.limit) ?? 20;
    const result = await listTemplatesPaginated({
      page: page < 1 ? 1 : page,
      limit: limit < 1 ? 20 : Math.min(limit, 100),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      academicYearId: optInt(req.query.academicYearId),
      includeDisabled: optBool(req.query.includeDisabled),
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Templates fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = optInt(req.params.id);
    if (!id) throw new ApiError(400, "Invalid template id.");
    const row = await getTemplateById(id);
    if (!row) throw new ApiError(404, "Template not found.");
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Template fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

const pickFiles = (req: Request) => {
  const files = (
    req as Request & {
      files?: Record<string, Express.Multer.File[]>;
    }
  ).files;
  return {
    templateImage: files?.templateImage?.[0],
    backsideImage: files?.backsideImage?.[0],
  };
};

export const createTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.academicYearId) {
      throw new ApiError(400, "academicYearId is required.");
    }
    const files = pickFiles(req);
    if (!files.templateImage)
      throw new ApiError(400, "Template image is required.");

    const userId =
      (req as Request & { user?: { id: number } }).user?.id ?? null;
    const id = await createTemplate(input, files, userId);
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Template created."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const updateTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = optInt(req.params.id);
    if (!id) throw new ApiError(400, "Invalid template id.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.academicYearId) {
      throw new ApiError(400, "academicYearId is required.");
    }
    const files = pickFiles(req);
    await updateTemplate(id, input, files);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", { id }, "Template updated."));
  } catch (e) {
    handleError(e, res, next);
  }
};

async function streamSide(
  req: Request,
  res: Response,
  next: NextFunction,
  side: "front" | "back",
) {
  try {
    const id = optInt(req.params.id);
    if (!id) throw new ApiError(400, "Invalid template id.");
    const [row] = await db
      .select({
        front: idCardTemplateModel.templateImageKey,
        back: idCardTemplateModel.backsideImageKey,
      })
      .from(idCardTemplateModel)
      .where(eq(idCardTemplateModel.id, id))
      .limit(1);
    const key = side === "front" ? row?.front : row?.back;
    if (!key) throw new ApiError(404, `Template ${side} image not found.`);
    const buffer = await getBufferFromS3(key);
    if (!buffer) throw new ApiError(502, "Could not fetch template image.");
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

export const streamTemplateImageController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => streamSide(req, res, next, "front");

export const streamTemplateBacksideController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => streamSide(req, res, next, "back");

export const deleteTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = optInt(req.params.id);
    if (!id) throw new ApiError(400, "Invalid template id.");
    await deleteTemplate(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Template deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
};
