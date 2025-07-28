import { Request, Response } from "express";
import {
  createSubjectType as createSubjectTypeService,
  getAllSubjectTypes as getAllSubjectTypesService,
  getSubjectTypeById as getSubjectTypeByIdService,
  updateSubjectType as updateSubjectTypeService,
  deleteSubjectType as deleteSubjectTypeService,
  bulkUploadSubjectTypes as bulkUploadSubjectTypesService
} from "../services/subject-type.service";
import * as XLSX from "xlsx";
import { ApiResponse } from "@/utils/ApiResonse";

export const createSubjectType = async (req: Request, res: Response) => {
  try {
    const newSubjectType = await createSubjectTypeService(req.body);
    res.status(201).json(newSubjectType);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: errorMessage });
  }
};

export const getAllSubjectTypes = async (_req: Request, res: Response) => {
  try {
    const allSubjectTypes = await getAllSubjectTypesService();
    res.json(allSubjectTypes);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
};

export const updateSubjectType = async (req: Request, res: Response) => {
  try {
    const updatedSubjectType = await updateSubjectTypeService(req.params.id, req.body);
    if (!updatedSubjectType) {
      res.status(404).json({ error: "Subject Type not found" });
      return;
    }
    res.json(updatedSubjectType);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: errorMessage });
  }
};

export const deleteSubjectType = async (req: Request, res: Response) => {
  try {
    const deletedSubjectType = await deleteSubjectTypeService(req.params.id);
    if (!deletedSubjectType) {
      res.status(404).json({ error: "Subject Type not found" });
      return;
    }
    res.json({ message: "Subject Type deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
};

export const bulkUploadSubjectTypesHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file || !req.file.path) {
      res.status(400).json({ error: "No file uploaded" });
      return ;
    }
    const result = await bulkUploadSubjectTypesService(req.file.path);
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Bulk upload completed"));
    return 
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
    return 
  }
};
