/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createHoliday,
  deleteHoliday,
  findHolidayById,
  findHolidayByName,
  findHolidaysPaginated,
  updateHoliday,
} from "@/features/library/services/holiday.service.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

export const getAllHolidaysController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const payload = await findHolidaysPaginated({
      page: page,
      limit: limit,
      search,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const holiday = await findHolidayById(id);
    if (!holiday) {
      res.status(404).json(new ApiError(404, "Holiday not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          holiday,
          "Holiday fetched successfully.",
        ),
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
    const { legacyHolidayId, name, shortName, from, to, remarks } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }

    if (!from || !to) {
      res.status(400).json(new ApiError(400, "From and To dates are required"));
      return;
    }

    const normalisedName = name.trim();
    const existing = await findHolidayByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Holiday already exists"));
      return;
    }

    const created = await createHoliday({
      legacyHolidayId:
        legacyHolidayId === undefined || legacyHolidayId === null
          ? null
          : Number(legacyHolidayId),
      name: normalisedName,
      shortName: shortName || null,
      from: new Date(from).toISOString().split("T")[0],
      to: new Date(to).toISOString().split("T")[0],
      remarks: remarks || null,
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findHolidayById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Holiday not found"));
      return;
    }

    const { legacyHolidayId, name, shortName, from, to, remarks } = req.body;
    const updateData: any = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findHolidayByName(normalisedName, id);
      if (duplicate) {
        res.status(409).json(new ApiError(409, "Holiday already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacyHolidayId !== undefined) {
      updateData.legacyHolidayId =
        legacyHolidayId === null ? null : Number(legacyHolidayId);
    }

    if (shortName !== undefined) {
      updateData.shortName = shortName || null;
    }

    if (from !== undefined) {
      updateData.from = new Date(from).toISOString().split("T")[0];
    }

    if (to !== undefined) {
      updateData.to = new Date(to).toISOString().split("T")[0];
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks || null;
    }

    const updated = await updateHoliday(id, updateData);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Holiday updated successfully.",
        ),
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
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findHolidayById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Holiday not found"));
      return;
    }

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
