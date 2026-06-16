import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createHoliday,
  deleteHoliday,
  findHolidaysPaginated,
  getHolidayById,
  updateHoliday,
  type HolidayUpsertInput,
} from "@/features/library/services/holiday.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const isYmd = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

const bodyToUpsert = (body: Record<string, unknown>): HolidayUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
  shortName: typeof body.shortName === "string" ? body.shortName : null,
  from: isYmd(body.from) ? body.from : "",
  to: isYmd(body.to) ? body.to : "",
  remarks: typeof body.remarks === "string" ? body.remarks : null,
});

export const getHolidayListController = async (
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
    const fromDate = isYmd(req.query.fromDate) ? req.query.fromDate : undefined;
    const toDate = isYmd(req.query.toDate) ? req.query.toDate : undefined;

    const result = await findHolidaysPaginated({
      page: safePage,
      limit: safeLimit,
      search,
      fromDate,
      toDate,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Holidays fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getHolidayByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid holiday id.");
    const row = await getHolidayById(id);
    if (!row) throw new ApiError(404, "Holiday not found.");
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Holiday fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    if (!input.from || !input.to) {
      throw new ApiError(
        400,
        "'from' and 'to' dates are required (YYYY-MM-DD).",
      );
    }
    const id = await createHoliday(input);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          { id },
          "Holiday created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid holiday id.");
    const existing = await getHolidayById(id);
    if (!existing) throw new ApiError(404, "Holiday not found.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    if (!input.from || !input.to) {
      throw new ApiError(
        400,
        "'from' and 'to' dates are required (YYYY-MM-DD).",
      );
    }
    await updateHoliday(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Holiday updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid holiday id.");
    const existing = await getHolidayById(id);
    if (!existing) throw new ApiError(404, "Holiday not found.");
    await deleteHoliday(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Holiday deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
