import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAcademicYear,
  findAllAcademicYears,
  findAcademicYearById,
  findCurrentAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setCurrentAcademicYear,
  findAcademicYearByYearRange,
} from "../services/academic-year.service.js";
import { AcademicYear } from "@repo/db/schemas/models/academics";

// Create new academic year
export const createAcademicYearHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { academicYear, session } = req.body;
    const newAcademicYear = await createAcademicYear(
      academicYear as Omit<AcademicYear, "id" | "createdAt" | "updatedAt">,
      session,
    );
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newAcademicYear,
          "New academic year created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get all academic years
export const getAllAcademicYearsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const academicYears = await findAllAcademicYears();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          academicYears,
          "Academic years fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get academic year by ID
export const getAcademicYearByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const academicYear = await findAcademicYearById(Number(id));

    if (!academicYear) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Academic year with ID ${id} not found`,
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          academicYear,
          "Academic year fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get current academic year
export const getCurrentAcademicYearHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentAcademicYear = await findCurrentAcademicYear();

    if (!currentAcademicYear) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "No current academic year found",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          currentAcademicYear,
          "Current academic year fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update academic year
export const updateAcademicYearHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log("in update academic year:", id);
    const updatedAcademicYear = await updateAcademicYear(
      Number(id),
      req.body as Partial<AcademicYear>,
    );

    if (!updatedAcademicYear) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Academic year with ID ${id} not found`,
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updatedAcademicYear,
          `Academic year with ID ${id} updated successfully`,
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete academic year
export const deleteAcademicYearHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await deleteAcademicYear(Number(id));

    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Academic year with ID ${id} not found`,
          ),
        );
      return;
    }

    res
      .status(200)
      .json(new ApiResponse(200, "DELETED", result, result.message));
  } catch (error) {
    handleError(error, res, next);
  }
};

// Set current academic year
export const setCurrentAcademicYearHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const currentAcademicYear = await setCurrentAcademicYear(Number(id));

    if (!currentAcademicYear) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Academic year with ID ${id} not found`,
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          currentAcademicYear,
          `Academic year with ID ${id} set as current successfully`,
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Find academic year by year range
export const findAcademicYearByYearRangeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { startYear, endYear } = req.query;

    if (!startYear || !endYear) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "startYear and endYear are required",
          ),
        );
      return;
    }

    const academicYear = await findAcademicYearByYearRange(
      startYear as string,
      endYear as string,
    );

    if (!academicYear) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Academic year with range ${startYear}-${endYear} not found`,
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          academicYear,
          "Academic year fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
