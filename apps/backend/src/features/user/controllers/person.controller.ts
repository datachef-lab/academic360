import { NextFunction, Response, Request } from "express";
import { handleError, ApiResponse, ApiError } from "@/utils/index.js";
import { createPersonSchema } from "@repo/db/schemas/models/user";
import {
  addPerson,
  findPersonById,
  savePerson,
  removePerson,
  getAllPersons,
} from "../services/person.service.js";
import { Person } from "@repo/db/schemas/models/user";
import { updateFamilyMemberTitles } from "../services/student.service.js";

export const createPerson = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parseResult = createPersonSchema.safeParse(req.body);
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
    const newPerson = await addPerson(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newPerson,
          "New Person is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPersonById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const foundPerson = await findPersonById(id);
    if (!foundPerson) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Person of ID ${id} not found`,
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
          foundPerson,
          "Fetched Person successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllPersonsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const persons = await getAllPersons();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          persons,
          "Fetched all persons successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePerson = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const parseResult = createPersonSchema.safeParse(req.body);
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
    const updatedPerson = await savePerson(id, req.body);
    if (!updatedPerson) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Person not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updatedPerson,
          "Person updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deletePerson = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const isDeleted = await removePerson(id);
    if (isDeleted === null) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Person with ID ${id} not found`,
          ),
        );
      return;
    }
    if (!isDeleted) {
      res
        .status(500)
        .json(new ApiResponse(500, "ERROR", null, "Failed to delete person"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", null, "Person deleted successfully"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Update family member titles for a student
export const updateFamilyMemberTitlesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { uid } = req.params;
    const { fatherTitle, motherTitle, guardianTitle } = req.body;

    // Validate UID parameter
    if (!uid || typeof uid !== "string") {
      res.status(400).json(new ApiError(400, "Student UID is required"));
      return;
    }

    // Validate that at least one title is provided
    if (!fatherTitle && !motherTitle && !guardianTitle) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "At least one family member title must be provided",
          ),
        );
      return;
    }

    // Validate title values if provided
    const validTitles = [
      "MR.",
      "MRS.",
      "MS.",
      "DR.",
      "PROF.",
      "REV.",
      "OTHER.",
      "LATE",
      "MR",
      "MRS",
      "MS",
      "DR",
      "PROF",
      "REV",
      "OTHER",
    ];

    if (fatherTitle && !validTitles.includes(fatherTitle)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid father title. Must be one of: ${validTitles.join(", ")}`,
          ),
        );
      return;
    }

    if (motherTitle && !validTitles.includes(motherTitle)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid mother title. Must be one of: ${validTitles.join(", ")}`,
          ),
        );
      return;
    }

    if (guardianTitle && !validTitles.includes(guardianTitle)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid guardian title. Must be one of: ${validTitles.join(", ")}`,
          ),
        );
      return;
    }

    console.info("[FAMILY-TITLE-UPDATE] Starting family member title update", {
      uid,
      fatherTitle,
      motherTitle,
      guardianTitle,
    });

    // Call the service to update family member titles
    const result = await updateFamilyMemberTitles(uid, {
      fatherTitle,
      motherTitle,
      guardianTitle,
    });

    if (!result.success) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            result.error || "Failed to update family member titles",
          ),
        );
      return;
    }

    console.info(
      "[FAMILY-TITLE-UPDATE] Family member titles updated successfully",
      {
        uid,
        updatedMembers: result.updatedMembers,
      },
    );

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          uid,
          updatedMembers: result.updatedMembers,
          updatedTitles: {
            fatherTitle: result.updatedTitles?.fatherTitle,
            motherTitle: result.updatedTitles?.motherTitle,
            guardianTitle: result.updatedTitles?.guardianTitle,
          },
        },
        "Family member titles updated successfully",
      ),
    );
  } catch (error) {
    console.error(
      "[FAMILY-TITLE-UPDATE] Error updating family member titles:",
      error,
    );
    handleError(error, res, next);
  }
};
