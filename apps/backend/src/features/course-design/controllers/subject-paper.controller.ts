import { Request, Response } from "express";
import { handleError } from "@/utils/handleError";
import {
  createSubjectPaper,
  getAllSubjectPapers,
  getSubjectPaperById,
  updateSubjectPaper,
  deleteSubjectPaper,
  getSubjectPapersWithPapers,
  bulkUploadSubjectPapers,
  BulkUploadRow,
} from "../services/subject-paper.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

export const createSubjectPaperController = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await createSubjectPaper(data);
    res.status(201).json(new ApiResponse(201, "SUCCESS", result, "Subject paper created successfully"));
    return ;    
  } catch (error) {
     handleError(error, res);
  }
};

export const getAllSubjectPapersController = async (req: Request, res: Response) => {
  try {
    const result = await getAllSubjectPapers();
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Subject papers retrieved successfully"));
    return ;
  } catch (error) {
    handleError(error, res);
  }
};

export const getSubjectPaperByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);
    if (isNaN(numericId)) {
      res.status(400).json(new ApiResponse(400, "FAIL", null, "Invalid ID"));
      return ;
    }
    const result = await getSubjectPaperById(numericId);
    if (!result) {
      res.status(404).json(new ApiResponse(404, "FAIL", null, "Subject paper not found"));
      return ;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Subject paper retrieved successfully"));
    return ;
  } catch (error) {
    handleError(error, res);
  }
};

export const updateSubjectPaperController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);
    if (isNaN(numericId)) {
      res.status(400).json(new ApiResponse(400, "FAIL", null, "Invalid ID"));
      return ;
    }
    const data = req.body;
    const result = await updateSubjectPaper(numericId, data);
    if (!result) {
      res.status(404).json(new ApiResponse(404, "FAIL", null, "Subject paper not found"));
      return ;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Subject paper updated successfully"));
    return ;
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteSubjectPaperController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const numericId = Number(id);
    if (isNaN(numericId)) {
      res.status(400).json(new ApiResponse(400, "FAIL", null, "Invalid ID"));
      return ;
    }
    const result = await deleteSubjectPaper(numericId);
    if (!result) {
      res.status(404).json(new ApiResponse(404, "FAIL", null, "Subject paper not found"));
      return ;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Subject paper deleted successfully"));
    return ;
  } catch (error) {
    handleError(error, res);
  }
};

export const getSubjectPapersWithPapersController = async (req: Request, res: Response) => {
  try {
    const result = await getSubjectPapersWithPapers();
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Subject papers with papers retrieved successfully"));
    return ;
  } catch (error) {
    handleError(error, res);
  }
};

export const bulkUploadSubjectPapersController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json(new ApiResponse(400, "FAIL", null, "No file uploaded"));
      return ;
    }

    // Parse Excel file
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!Array.isArray(data) || data.length === 0) {
      res.status(400).json(new ApiResponse(400, "FAIL", null, "No data found in file"));
      return ;
    }

    const result = await bulkUploadSubjectPapers(data as BulkUploadRow[]);
    res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Bulk upload completed"));
    return ;
  } catch (error) {
    handleError(error, res);
  }
}; 