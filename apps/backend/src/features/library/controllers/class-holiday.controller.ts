import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createClassHoliday,
  deleteClassHoliday,
  findClassHolidayById,
  findClassHolidaysPaginated,
  updateClassHoliday,
} from "@/features/library/services/class-holiday.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllClassHolidaysController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit =
      Number.isNaN(limit) || limit < 1 ? 10 : Math.min(limit, 100);

    const payload = await findClassHolidaysPaginated({
      page: safePage,
      limit: safeLimit,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const classHoliday = await findClassHolidayById(id);
    if (!classHoliday) {
      res.status(404).json(new ApiError(404, "Class holiday not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          classHoliday,
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
    const {
      legacyHolidayStudentMappingId,
      holidayId,
      programCourseId,
      classId,
      isHoliday,
    } = req.body;

    if (!holidayId || Number.isNaN(Number(holidayId))) {
      res.status(400).json(new ApiError(400, "Valid holidayId is required"));
      return;
    }

    if (!programCourseId || Number.isNaN(Number(programCourseId))) {
      res
        .status(400)
        .json(new ApiError(400, "Valid programCourseId is required"));
      return;
    }

    if (!classId || Number.isNaN(Number(classId))) {
      res.status(400).json(new ApiError(400, "Valid classId is required"));
      return;
    }

    const created = await createClassHoliday({
      legacyHolidayStudentMappingId:
        legacyHolidayStudentMappingId === undefined ||
        legacyHolidayStudentMappingId === null
          ? null
          : Number(legacyHolidayStudentMappingId),
      holidayId: Number(holidayId),
      programCourseId: Number(programCourseId),
      classId: Number(classId),
      isHoliday: isHoliday || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findClassHolidayById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Class holiday not found"));
      return;
    }

    const {
      legacyHolidayStudentMappingId,
      holidayId,
      programCourseId,
      classId,
      isHoliday,
    } = req.body;
    const updateData: any = { updatedAt: new Date() };

    if (legacyHolidayStudentMappingId !== undefined) {
      updateData.legacyHolidayStudentMappingId =
        legacyHolidayStudentMappingId === null
          ? null
          : Number(legacyHolidayStudentMappingId);
    }

    if (holidayId !== undefined) {
      if (Number.isNaN(Number(holidayId))) {
        res.status(400).json(new ApiError(400, "Valid holidayId is required"));
        return;
      }
      updateData.holidayId = Number(holidayId);
    }

    if (programCourseId !== undefined) {
      if (Number.isNaN(Number(programCourseId))) {
        res
          .status(400)
          .json(new ApiError(400, "Valid programCourseId is required"));
        return;
      }
      updateData.programCourseId = Number(programCourseId);
    }

    if (classId !== undefined) {
      if (Number.isNaN(Number(classId))) {
        res.status(400).json(new ApiError(400, "Valid classId is required"));
        return;
      }
      updateData.classId = Number(classId);
    }

    if (isHoliday !== undefined) {
      updateData.isHoliday = Boolean(isHoliday);
    }

    const updated = await updateClassHoliday(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findClassHolidayById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Class holiday not found"));
      return;
    }

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
