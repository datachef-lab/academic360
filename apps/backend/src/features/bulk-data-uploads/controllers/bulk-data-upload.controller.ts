import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import fs from "fs";
import type {
  CuRegRollExcelUploadRow,
  ExamFormFillupExcelUploadRow,
} from "@repo/db/dtos";
import {
  bulkUploadCuRegRoll,
  bulkUploadExamFormFillup,
  parseCuRegRollExcelFile,
  parseExamFormFillupExcelFile,
} from "../services/index.js";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

/** Query `mode` values supported by POST /api/v1/bulk-data-uploads */
export const BULK_DATA_UPLOAD_MODES = [
  "exam-form-fillup",
  "cu-reg-roll",
] as const;
export type BulkDataUploadMode = (typeof BULK_DATA_UPLOAD_MODES)[number];

const bulkUploadModeSchema = z.enum(BULK_DATA_UPLOAD_MODES);

function parseDryRun(req: Request): boolean {
  const v = req.query.dryRun;
  return v === "true" || v === "1";
}

/** Multipart form fields for exam-form-fillup (same shape as {@link BulkUploadContextProps} minus `io`). */
const bulkExamFormFillupFormSchema = z.object({
  affiliationId: z.coerce.number().int().positive(),
  regulationTypeId: z.coerce.number().int().positive(),
  academicYearId: z.coerce.number().int().positive(),
  classId: z.coerce.number().int().positive(),
  uploadSessionId: z.string().optional(),
});

async function handleExamFormFillupBulkUpload(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = bulkExamFormFillupFormSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten(),
          "Invalid form fields (affiliationId, regulationTypeId, academicYearId, classId)",
        ),
      );
    return;
  }

  if (!req.file?.path) {
    res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "BAD_REQUEST",
          null,
          "Excel file is required (form field name: file)",
        ),
      );
    return;
  }

  const tempFilePath = req.file.path;

  let data: ExamFormFillupExcelUploadRow[];
  try {
    data = parseExamFormFillupExcelFile(tempFilePath);
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    res.status(400).json(new ApiResponse(400, "EXCEL_PARSE_ERROR", null, msg));
    return;
  }

  const userId = (req.user as { id?: number } | undefined)?.id;
  const progressUserId =
    parsed.data.uploadSessionId ??
    (userId != null ? String(userId) : undefined);

  const outcome = await bulkUploadExamFormFillup(
    {
      affiliationId: parsed.data.affiliationId,
      regulationTypeId: parsed.data.regulationTypeId,
      academicYearId: parsed.data.academicYearId,
      classId: parsed.data.classId,
      data,
      uploadSessionId: parsed.data.uploadSessionId,
    },
    { progressUserId, dryRun: parseDryRun(req) },
  );

  if (!outcome.ok) {
    res.status(400).json(
      new ApiResponse(
        400,
        "BULK_UPLOAD_VALIDATION_FAILED",
        {
          errors: outcome.errors,
          validationErrors: outcome.validationErrors ?? null,
        },
        outcome.errors[0] ?? "Validation failed",
      ),
    );
    return;
  }

  const { result } = outcome;
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "SUCCESS",
        result,
        `Bulk upload finished: ${result.summary.successful} successful, ${result.summary.failed} failed.`,
      ),
    );
}

const bulkCuRegRollFormSchema = z.object({
  uploadSessionId: z.string().optional(),
});

async function handleCuRegRollBulkUpload(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = bulkCuRegRollFormSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten(),
          "Invalid form fields",
        ),
      );
    return;
  }

  if (!req.file?.path) {
    res
      .status(400)
      .json(
        new ApiResponse(
          400,
          "BAD_REQUEST",
          null,
          "Excel file is required (form field name: file)",
        ),
      );
    return;
  }

  const tempFilePath = req.file.path;

  let data: CuRegRollExcelUploadRow[];
  try {
    data = parseCuRegRollExcelFile(tempFilePath);
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    res.status(400).json(new ApiResponse(400, "EXCEL_PARSE_ERROR", null, msg));
    return;
  }

  const userId = (req.user as { id?: number } | undefined)?.id;
  const progressUserId =
    parsed.data.uploadSessionId ??
    (userId != null ? String(userId) : undefined);

  const outcome = await bulkUploadCuRegRoll(
    {
      data,
      uploadSessionId: parsed.data.uploadSessionId,
    },
    { progressUserId, dryRun: parseDryRun(req) },
  );

  if (!outcome.ok) {
    res.status(400).json(
      new ApiResponse(
        400,
        "BULK_UPLOAD_VALIDATION_FAILED",
        {
          errors: outcome.errors,
          validationErrors: outcome.validationErrors ?? null,
        },
        outcome.errors[0] ?? "Validation failed",
      ),
    );
    return;
  }

  const { result } = outcome;
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "SUCCESS",
        result,
        `CU Reg/Roll update finished: ${result.updated} updated, ${result.notFound.length} UID(s) not found.`,
      ),
    );
}

/**
 * POST multipart: `file` + mode-specific fields. Query: `mode` (e.g. `exam-form-fillup`, `cu-reg-roll`).
 */
export const bulkDataUploadHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const tempFilePath = req.file?.path;
  try {
    const modeParsed = bulkUploadModeSchema.safeParse(req.query.mode);
    if (!modeParsed.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "INVALID_MODE",
            { allowedModes: [...BULK_DATA_UPLOAD_MODES] },
            `Query parameter "mode" is required and must be one of: ${BULK_DATA_UPLOAD_MODES.join(", ")}`,
          ),
        );
      return;
    }

    switch (modeParsed.data) {
      case "exam-form-fillup":
        await handleExamFormFillupBulkUpload(req, res);
        break;
      case "cu-reg-roll":
        await handleCuRegRollBulkUpload(req, res);
        break;
    }
  } catch (error) {
    handleError(error, res, next);
  } finally {
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch {
        /* temp cleanup best-effort */
      }
    }
  }
};
