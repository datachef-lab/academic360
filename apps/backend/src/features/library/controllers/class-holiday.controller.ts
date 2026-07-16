import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createClassHoliday,
  deleteClassHoliday,
  findClassHolidaysPaginated,
  getClassHolidayById,
  updateClassHoliday,
  type ClassHolidayUpsertInput,
} from "@/features/library/services/class-holiday.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const parseRequiredId = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const bodyToUpsert = (
  body: Record<string, unknown>,
): ClassHolidayUpsertInput => ({
  holidayId: parseRequiredId(body.holidayId) ?? 0,
  programCourseId: parseRequiredId(body.programCourseId) ?? 0,
  classId: parseRequiredId(body.classId) ?? 0,
  isHoliday: Boolean(body.isHoliday),
});

const validate = (input: ClassHolidayUpsertInput) => {
  if (!input.holidayId) throw new ApiError(400, "holidayId is required.");
  if (!input.programCourseId)
    throw new ApiError(400, "programCourseId is required.");
  if (!input.classId) throw new ApiError(400, "classId is required.");
};

export const getClassHolidayListController = async (
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

    const holidayId = parseRequiredId(req.query.holidayId) ?? undefined;
    const programCourseId =
      parseRequiredId(req.query.programCourseId) ?? undefined;
    const classId = parseRequiredId(req.query.classId) ?? undefined;

    const result = await findClassHolidaysPaginated({
      page: safePage,
      limit: safeLimit,
      holidayId,
      programCourseId,
      classId,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Class holidays fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getClassHolidayByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid class holiday id.");
    const row = await getClassHolidayById(id);
    if (!row) throw new ApiError(404, "Class holiday not found.");
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Class holiday fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createClassHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    validate(input);
    const id = await createClassHoliday(input);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          { id },
          "Class holiday created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateClassHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid class holiday id.");
    const existing = await getClassHolidayById(id);
    if (!existing) throw new ApiError(404, "Class holiday not found.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    validate(input);
    await updateClassHoliday(id, input);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Class holiday updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteClassHolidayController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid class holiday id.");
    const existing = await getClassHolidayById(id);
    if (!existing) throw new ApiError(404, "Class holiday not found.");
    await deleteClassHoliday(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Class holiday deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
