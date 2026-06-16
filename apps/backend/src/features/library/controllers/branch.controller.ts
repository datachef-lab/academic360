import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createBranch,
  deleteBranch,
  findBranchesPaginated,
  getBranchById,
  updateBranch,
  type BranchUpsertInput,
} from "@/features/library/services/branch.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

const bodyToUpsert = (body: Record<string, unknown>): BranchUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
  code: str(body.code),
  openingDate: str(body.openingDate),
  isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
  remarks: str(body.remarks),
});

export const getBranchListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit =
      Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 100);
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const isActive =
      req.query.isActive === "true"
        ? true
        : req.query.isActive === "false"
          ? false
          : undefined;
    const result = await findBranchesPaginated({
      page: safePage,
      limit: safeLimit,
      search,
      isActive,
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Branches fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getBranchByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid branch id.");
    const row = await getBranchById(id);
    if (!row) throw new ApiError(404, "Branch not found.");
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Branch fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createBranchController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    const id = await createBranch(input);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", { id }, "Branch created successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateBranchController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid branch id.");
    const existing = await getBranchById(id);
    if (!existing) throw new ApiError(404, "Branch not found.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    await updateBranch(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Branch updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteBranchController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid branch id.");
    const existing = await getBranchById(id);
    if (!existing) throw new ApiError(404, "Branch not found.");
    await deleteBranch(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Branch deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
