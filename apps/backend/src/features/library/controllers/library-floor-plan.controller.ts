import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  deleteFloorPlan,
  getFloorPlanWithInventory,
  listFloorPlans,
  saveFloorPlan,
} from "@/features/library/services/library-floor-plan.service.js";

const optId = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const parseId = (v?: string | string[]): number | null => {
  const input = Array.isArray(v) ? v[0] : v;
  const n = Number(input);
  if (!input || Number.isNaN(n)) return null;
  return n;
};

export const listFloorPlansController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rows = await listFloorPlans(optId(req.query.branchId));
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Floor plans fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getFloorPlanController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const plan = await getFloorPlanWithInventory(id);
    if (!plan) throw new ApiError(404, "Floor plan not found.");
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          plan,
          "Floor plan with inventory fetched.",
        ),
      );
  } catch (e) {
    handleError(e, res, next);
  }
};

export const saveFloorPlanController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const b = req.body as Record<string, unknown>;
    const branchId = Number(b.branchId);
    if (!branchId || Number.isNaN(branchId))
      throw new ApiError(400, "branchId is required.");
    const id = await saveFloorPlan({
      id: parseId(req.params.id) ?? undefined,
      branchId,
      name: typeof b.name === "string" ? b.name : "",
      layout: b.layout as never,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", { id }, "Floor plan saved."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const deleteFloorPlanController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await deleteFloorPlan(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Floor plan deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
};
