import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createCirculationPolicy,
  deleteCirculationPolicy,
  findCirculationPoliciesPaginated,
  getCirculationPolicyById,
  resolveCirculationPolicy,
  updateCirculationPolicy,
  type CirculationPolicyUpsertInput,
} from "@/features/library/services/circulation-policy.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const parseOptionalId = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const bodyToUpsert = (
  body: Record<string, unknown>,
): CirculationPolicyUpsertInput => ({
  patronCategoryId: parseOptionalId(body.patronCategoryId) ?? 0,
  itemCategoryId: parseOptionalId(body.itemCategoryId) ?? 0,
  loanDays: Number(body.loanDays ?? 0),
  finePerDay: Number(body.finePerDay ?? 0),
  renewalLimit: Number(body.renewalLimit ?? 0),
  graceDays: Number(body.graceDays ?? 0),
  maxCopiesAtOnce: Number(body.maxCopiesAtOnce ?? 1),
  skipHolidaysInFine: Boolean(body.skipHolidaysInFine ?? true),
  isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
});

export const getCirculationPolicyListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit =
      Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 200);
    const patronCategoryId = parseOptionalId(req.query.patronCategoryId);
    const itemCategoryId = parseOptionalId(req.query.itemCategoryId);
    const result = await findCirculationPoliciesPaginated({
      page: safePage,
      limit: safeLimit,
      patronCategoryId,
      itemCategoryId,
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Circulation policies fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getCirculationPolicyByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid policy id.");
    const row = await getCirculationPolicyById(id);
    if (!row) throw new ApiError(404, "Policy not found.");
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Policy fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const resolveCirculationPolicyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const patronCategoryId = parseOptionalId(req.query.patronCategoryId);
    const itemCategoryId = parseOptionalId(req.query.itemCategoryId);
    if (!patronCategoryId || !itemCategoryId) {
      throw new ApiError(
        400,
        "patronCategoryId and itemCategoryId query params are required.",
      );
    }
    const row = await resolveCirculationPolicy(
      patronCategoryId,
      itemCategoryId,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          row
            ? "Active policy resolved."
            : "No active policy matches this combination.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createCirculationPolicyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    const id = await createCirculationPolicy(input);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", { id }, "Policy created successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateCirculationPolicyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid policy id.");
    const existing = await getCirculationPolicyById(id);
    if (!existing) throw new ApiError(404, "Policy not found.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    await updateCirculationPolicy(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Policy updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteCirculationPolicyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid policy id.");
    const existing = await getCirculationPolicyById(id);
    if (!existing) throw new ApiError(404, "Policy not found.");
    await deleteCirculationPolicy(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Policy deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
