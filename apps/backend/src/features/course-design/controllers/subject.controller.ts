import { Request, Response } from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectsPaginated,
  getSubjectById,
  getActiveSubjects,
  updateSubject,
  deleteSubject,
  bulkUploadSubjects,
} from "../services/subject.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

export const createSubjectController = async (req: Request, res: Response) => {
  try {
    const { legacySubjectId, name, code, sequence, isActive } = req.body;

    // Validate required fields
    if (!name) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Subject name is required"));
    }

    const subjectData = {
      legacySubjectId: legacySubjectId || null,
      name,
      code: code || null,
      sequence: sequence || null,
      isActive: isActive !== undefined ? isActive : true,
    };

    const createdSubject = await createSubject(subjectData);

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          createdSubject,
          "Subject created successfully!",
        ),
      );
  } catch (error) {
    console.error("Error creating subject:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "ERROR", null, "Internal server error"));
  }
};

export const getAllSubjectsController = async (req: Request, res: Response) => {
  try {
    const subjects = await getAllSubjects();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          subjects,
          "Subjects retrieved successfully!",
        ),
      );
  } catch (error) {
    console.error("Error retrieving subjects:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "ERROR", null, "Internal server error"));
  }
};

export const getSubjectsPaginatedController = async (
  req: Request,
  res: Response,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;
    const isActive = req.query.isActive
      ? req.query.isActive === "true"
      : undefined;

    const result = await getSubjectsPaginated({
      page,
      pageSize,
      search,
      isActive,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Subjects retrieved successfully!",
        ),
      );
  } catch (error) {
    console.error("Error retrieving paginated subjects:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "ERROR", null, "Internal server error"));
  }
};

export const getSubjectByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subjectId = parseInt(id as string);

    if (isNaN(subjectId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid subject ID"));
    }

    const subject = await getSubjectById(subjectId);

    if (!subject) {
      return res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Subject not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          subject,
          "Subject retrieved successfully!",
        ),
      );
  } catch (error) {
    console.error("Error retrieving subject:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "ERROR", null, "Internal server error"));
  }
};

export const getActiveSubjectsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const subjects = await getActiveSubjects();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          subjects,
          "Active subjects retrieved successfully!",
        ),
      );
  } catch (error) {
    console.error("Error retrieving active subjects:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "ERROR", null, "Internal server error"));
  }
};

export const updateSubjectController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subjectId = parseInt(id as string);

    if (isNaN(subjectId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid subject ID"));
    }

    const { legacySubjectId, name, code, sequence, isActive } = req.body;

    // Check if subject exists
    const existingSubject = await getSubjectById(subjectId);
    if (!existingSubject) {
      return res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Subject not found"));
    }

    const updateData: any = {};
    if (legacySubjectId !== undefined)
      updateData.legacySubjectId = legacySubjectId;
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (sequence !== undefined) updateData.sequence = sequence;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSubject = await updateSubject(subjectId, updateData);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedSubject,
          "Subject updated successfully!",
        ),
      );
  } catch (error) {
    console.error("Error updating subject:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "ERROR", null, "Internal server error"));
  }
};

export const deleteSubjectController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subjectId = parseInt(id as string);

    if (isNaN(subjectId)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid subject ID"));
    }

    // Check if subject exists
    const existingSubject = await getSubjectById(subjectId);
    if (!existingSubject) {
      return res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Subject not found"));
    }

    await deleteSubject(subjectId);

    return res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Subject deleted successfully!"),
      );
  } catch (error) {
    console.error("Error deleting subject:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "ERROR", null, "Internal server error"));
  }
};

export const bulkUploadSubjectsController = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "No file uploaded"));
    }

    const result = await bulkUploadSubjects(req.file);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          `Bulk upload completed. ${result.success.length} subjects created successfully.`,
        ),
      );
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, "ERROR", null, "Internal server error"));
  }
};
