import { NextFunction, Request, Response } from "express";

import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  FieldUpsertInput,
  listFields,
  upsertFieldsBulk,
} from "@/features/idcard/services/id-card-template-field.service.js";

const optInt = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const listFieldsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = optInt(req.params.id);
    if (!id) throw new ApiError(400, "Invalid template id.");
    const rows = await listFields(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Fields fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const upsertFieldsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = optInt(req.params.id);
    if (!id) throw new ApiError(400, "Invalid template id.");

    const body = req.body as { fields?: unknown };
    if (!Array.isArray(body.fields)) {
      throw new ApiError(400, "Body must contain an array of fields.");
    }
    const inputs: FieldUpsertInput[] = body.fields.map((raw: any) => ({
      fieldKey: raw?.fieldKey,
      x: Number(raw?.x ?? 0),
      y: Number(raw?.y ?? 0),
      width: raw?.width != null ? Number(raw.width) : null,
      height: raw?.height != null ? Number(raw.height) : null,
      isVisible:
        typeof raw?.isVisible === "boolean" ? raw.isVisible : undefined,
    }));
    const rows = await upsertFieldsBulk(id, inputs);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Fields updated."));
  } catch (e) {
    handleError(e, res, next);
  }
};
