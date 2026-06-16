import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createVendor,
  deleteVendor,
  findVendorsPaginated,
  getVendorById,
  updateVendor,
  type VendorUpsertInput,
} from "@/features/library/services/vendor.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

const bodyToUpsert = (body: Record<string, unknown>): VendorUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
  code: str(body.code),
  email: str(body.email),
  phone: str(body.phone),
  website: str(body.website),
  personOfContact: str(body.personOfContact),
  personOfContactEmail: str(body.personOfContactEmail),
  personOfContactPhone: str(body.personOfContactPhone),
  pan: str(body.pan),
});

export const getVendorListController = async (
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

    const result = await findVendorsPaginated({
      page: safePage,
      limit: safeLimit,
      search,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Vendors fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getVendorByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid vendor id.");
    const row = await getVendorById(id);
    if (!row) throw new ApiError(404, "Vendor not found.");
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Vendor fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createVendorController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    const id = await createVendor(input);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", { id }, "Vendor created successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateVendorController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid vendor id.");
    const existing = await getVendorById(id);
    if (!existing) throw new ApiError(404, "Vendor not found.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    await updateVendor(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Vendor updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteVendorController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid vendor id.");
    const existing = await getVendorById(id);
    if (!existing) throw new ApiError(404, "Vendor not found.");
    await deleteVendor(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Vendor deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
