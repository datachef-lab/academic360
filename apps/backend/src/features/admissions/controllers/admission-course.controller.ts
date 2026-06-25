import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAdmissionCourse,
  deleteAdmissionCourse,
  findAdmissionCourseById,
  findAdmissionCoursesByAdmissionId,
  updateAdmissionCourse,
} from "@/features/admissions/services/admission-course.service.js";

export const createAdmissionCourseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { admissionId, programCourseId } = req.body;
    if (!admissionId || !programCourseId) {
      res
        .status(400)
        .json(
          new ApiError(400, "admissionId and programCourseId are required"),
        );
      return;
    }
    const result = await createAdmissionCourse({
      admissionId: Number(admissionId),
      programCourseId: Number(programCourseId),
      amount: req.body.amount != null ? Number(req.body.amount) : 750,
      shiftId: req.body.shiftId ? Number(req.body.shiftId) : null,
      classId: req.body.classId ? Number(req.body.classId) : null,
      isActive: req.body.isActive ?? true,
      isClosed: req.body.isClosed ?? false,
      remarks: req.body.remarks ?? null,
    });
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          result,
          "Admission course created successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionCourseByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await findAdmissionCourseById(Number(req.params.id));
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Admission course ${req.params.id} not found`,
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
          result,
          "Admission course fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAdmissionCoursesByAdmissionIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await findAdmissionCoursesByAdmissionId(
      Number(req.params.admissionId),
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Admission courses fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAdmissionCourseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const data: Record<string, unknown> = {};
    if (req.body.programCourseId !== undefined)
      data.programCourseId = Number(req.body.programCourseId);
    if (req.body.amount !== undefined) data.amount = Number(req.body.amount);
    if (req.body.shiftId !== undefined)
      data.shiftId = req.body.shiftId ? Number(req.body.shiftId) : null;
    if (req.body.classId !== undefined)
      data.classId = req.body.classId ? Number(req.body.classId) : null;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;
    if (req.body.isClosed !== undefined) data.isClosed = req.body.isClosed;
    if (req.body.remarks !== undefined) data.remarks = req.body.remarks;
    const result = await updateAdmissionCourse(id, data);
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Admission course ${id} not found`,
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
          result,
          "Admission course updated successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAdmissionCourseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await deleteAdmissionCourse(Number(req.params.id));
    if (!result) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Admission course ${req.params.id} not found`,
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
          result,
          "Admission course deleted successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
