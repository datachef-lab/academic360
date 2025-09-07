import { Request, Response } from "express";
import {
  createSubjectType as createSubjectTypeService,
  getAllSubjectTypes as getAllSubjectTypesService,
  getSubjectTypeById as getSubjectTypeByIdService,
  updateSubjectType as updateSubjectTypeService,
  deleteSubjectTypeSafe as deleteSubjectTypeService,
  bulkUploadSubjectTypes as bulkUploadSubjectTypesService,
} from "../services/subject-type.service.js";
import * as XLSX from "xlsx";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { socketService } from "@/services/socketService.js";

export const createSubjectType = async (req: Request, res: Response) => {
  try {
    const newSubjectType = await createSubjectTypeService(req.body);
    if (!newSubjectType) {
      res.status(400).json({ error: "Subject Type already exists" });
      return;
    }
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newSubjectType,
          "Subject type created successfully",
        ),
      );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: errorMessage });
  }
};

export const getAllSubjectTypes = async (_req: Request, res: Response) => {
  try {
    const allSubjectTypes = await getAllSubjectTypesService();
    res.json(
      new ApiResponse(
        200,
        "SUCCESS",
        allSubjectTypes,
        "Subject types retrieved successfully",
      ),
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
};

export const getSubjectTypeById = async (req: Request, res: Response) => {
  try {
    const subjectType = await getSubjectTypeByIdService(req.params.id);
    if (!subjectType) {
      res.status(404).json({ error: "Subject Type not found" });
      return;
    }
    res.json(subjectType);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
};

export const updateSubjectType = async (req: Request, res: Response) => {
  try {
    const updatedSubjectType = await updateSubjectTypeService(
      req.params.id,
      req.body,
    );
    if (!updatedSubjectType) {
      res.status(404).json({ error: "Subject Type not found" });
      return;
    }
    res.json(updatedSubjectType);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: errorMessage });
  }
};

export const deleteSubjectType = async (req: Request, res: Response) => {
  try {
    const result = await deleteSubjectTypeService(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Subject Type not found" });
      return;
    }
    res.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
};

export const bulkUploadSubjectTypesHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.file || !req.file.path) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const uploadSessionId =
      req.body.uploadSessionId || req.query.uploadSessionId;
    const io = socketService.getIO();
    const result = await bulkUploadSubjectTypesService(
      req.file.path,
      io,
      uploadSessionId,
    );
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Bulk upload completed"));
    return;
  } catch (error: unknown) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};
