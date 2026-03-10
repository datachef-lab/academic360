import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUserStaffDepartmentMapping,
  deleteUserStaffDepartmentMapping,
  getUserStaffDepartmentMappingById,
  getUserStaffDepartmentMappingByStaffAndDepartment,
  getUserStaffDepartmentMappingsByStaffId,
  getUserStaffDepartmentMappingsByDepartmentId,
  getAllUserStaffDepartmentMappings,
} from "@/features/administration/services/user-staff-department-mapping.service.js";

export const createUserStaffDepartmentMappingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { staffId, departmentId } = req.body;

    if (typeof staffId !== "number" || Number.isNaN(staffId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid staffId (number) is required"));
      return;
    }

    if (typeof departmentId !== "number" || Number.isNaN(departmentId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid departmentId (number) is required"));
      return;
    }

    const existing = await getUserStaffDepartmentMappingByStaffAndDepartment(
      staffId,
      departmentId,
    );
    if (existing) {
      res
        .status(409)
        .json(
          new ApiError(409, "This staff is already mapped to this department"),
        );
      return;
    }

    const createPayload = { staffId, departmentId };
    const created = await createUserStaffDepartmentMapping(createPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User staff department mapping created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStaffDepartmentMappingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const staffIdParam = req.query.staffId as string | undefined;
    const departmentIdParam = req.query.departmentId as string | undefined;

    if (staffIdParam !== undefined) {
      const staffId = Number(staffIdParam);
      if (Number.isNaN(staffId)) {
        res
          .status(400)
          .json(new ApiError(400, "staffId must be a valid number"));
        return;
      }
      const mappings = await getUserStaffDepartmentMappingsByStaffId(staffId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            mappings,
            "User staff department mappings fetched successfully",
          ),
        );
    } else if (departmentIdParam !== undefined) {
      const departmentId = Number(departmentIdParam);
      if (Number.isNaN(departmentId)) {
        res
          .status(400)
          .json(new ApiError(400, "departmentId must be a valid number"));
        return;
      }
      const mappings =
        await getUserStaffDepartmentMappingsByDepartmentId(departmentId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            mappings,
            "User staff department mappings fetched successfully",
          ),
        );
    } else {
      const mappings = await getAllUserStaffDepartmentMappings();
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            mappings,
            "User staff department mappings fetched successfully",
          ),
        );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserStaffDepartmentMappingByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const mappingId = Number(id);

    if (!id || Number.isNaN(mappingId)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Valid user staff department mapping ID is required",
          ),
        );
      return;
    }

    const mapping = await getUserStaffDepartmentMappingById(mappingId);
    if (!mapping) {
      res
        .status(404)
        .json(new ApiError(404, "User staff department mapping not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          mapping,
          "User staff department mapping fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserStaffDepartmentMappingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const mappingId = Number(id);

    if (!id || Number.isNaN(mappingId)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Valid user staff department mapping ID is required",
          ),
        );
      return;
    }

    const existing = await getUserStaffDepartmentMappingById(mappingId);
    if (!existing) {
      res
        .status(404)
        .json(new ApiError(404, "User staff department mapping not found"));
      return;
    }

    await deleteUserStaffDepartmentMapping(mappingId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "User staff department mapping deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
