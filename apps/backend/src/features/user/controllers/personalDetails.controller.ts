import { NextFunction, Request, Response } from "express";
import {
  addPersonalDetails,
  findPersonalDetailsById,
  findPersonalDetailsByStudentId,
  savePersonalDetails,
  savePersonalDetailsByStudentId,
  removePersonalDetails,
  removePersonalDetailsByStudentId,
  getAllPersonalDetails,
} from "../services/personalDetails.service.js";
import { createPersonalDetailsSchema } from "@repo/db/schemas/models/user";
import { ApiResponse, handleError } from "@/utils/index.js";

// Create Personal Details
export const createPersonalDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Validate request body
    const parseResult = createPersonalDetailsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }
    const newPersonalDetails = await addPersonalDetails(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newPersonalDetails,
          "Personal details created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get Personal Details by ID
export const getPersonalDetailsById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const foundPersonalDetails = await findPersonalDetailsById(Number(id));
    if (!foundPersonalDetails) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Personal Details of ID ${id} not found`,
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
          foundPersonalDetails,
          "Personal details fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Get Personal Details by Student ID
export const getPersonalDetailsByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const foundPersonalDetails = await findPersonalDetailsByStudentId(
      Number(studentId),
    );
    if (!foundPersonalDetails) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Personal Details of Student-ID ${studentId} not found`,
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
          foundPersonalDetails,
          "Personal details fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update Personal Details
export const updatePersonalDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    // Validate request body (excluding relation objects which are not in the schema)
    const {
      userDetails,
      address,
      category,
      religion,
      nationality,
      motherTongue,
      disabilityCode,
      residentialAddress,
      mailingAddress,
      ...bodyWithoutExtraFields
    } = req.body;
    const parseResult = createPersonalDetailsSchema.safeParse(
      bodyWithoutExtraFields,
    );
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }
    // Reconstruct the body with relation objects preserved
    const validatedBody = {
      ...parseResult.data,
      userDetails,
      address,
      category,
      religion,
      nationality,
      motherTongue,
      disabilityCode,
      residentialAddress,
      mailingAddress,
    };
    const updatedDetails = await savePersonalDetails(Number(id), validatedBody);
    if (!updatedDetails) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Personal Details with ID ${id} not found`,
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
          updatedDetails,
          "Personal details updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update Personal Details by Student ID
export const updatePersonalDetailsByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId } = req.params;
    // Validate request body (excluding relation objects which are not in the schema)
    const {
      userDetails,
      address,
      category,
      religion,
      nationality,
      motherTongue,
      disabilityCode,
      residentialAddress,
      mailingAddress,
      ...bodyWithoutExtraFields
    } = req.body;
    const parseResult = createPersonalDetailsSchema.safeParse(
      bodyWithoutExtraFields,
    );
    if (!parseResult.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parseResult.error.flatten()),
          ),
        );
      return;
    }
    // Reconstruct the body with relation objects preserved
    const validatedBody = {
      ...parseResult.data,
      userDetails,
      address,
      category,
      religion,
      nationality,
      motherTongue,
      disabilityCode,
      residentialAddress,
      mailingAddress,
    };
    const updatedDetails = await savePersonalDetailsByStudentId(
      Number(studentId),
      validatedBody,
    );
    if (!updatedDetails) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Personal Details for student ID ${studentId} not found`,
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
          updatedDetails,
          "Personal details updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete Personal Details by ID
export const deletePersonalDetailsById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const isDeleted = await removePersonalDetails(Number(id));
    if (isDeleted === null) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Personal Details with ID ${id} not found`,
          ),
        );
      return;
    }
    if (!isDeleted) {
      res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to delete personal details",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          null,
          "Personal details deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Delete Personal Details by Student ID
export const deletePersonalDetailsByStudentId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId } = req.params;
    const isDeleted = await removePersonalDetailsByStudentId(Number(studentId));
    if (isDeleted === null) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Personal Details for student ID ${studentId} not found`,
          ),
        );
      return;
    }
    if (!isDeleted) {
      res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to delete personal details",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          null,
          "Personal details deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllPersonalDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const details = await getAllPersonalDetails();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          details,
          "Fetched all personal details successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
