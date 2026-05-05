import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import {
  getAllActivityMasters,
  getActivityMasterById,
  createActivityMaster,
  updateActivityMaster,
  deleteActivityMaster,
  CreateMasterPayload,
} from "../services/academic-activity-master.service.js";

export async function getAllActivityMastersController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const masters = await getAllActivityMasters();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          masters,
          "Activity masters fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getActivityMasterByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const master = await getActivityMasterById(id);
    if (!master) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Activity master not found"),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          master,
          "Activity master fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createActivityMasterController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload: CreateMasterPayload = {
      type: req.body.type,
      name: req.body.name,
      description: req.body.description ?? null,
      isActive: req.body.isActive ?? true,
    };

    if (!payload.type || !payload.name) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "type and name are required",
          ),
        );
      return;
    }

    const created = await createActivityMaster(payload);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Activity master created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateActivityMasterController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const updated = await updateActivityMaster(id, req.body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Activity master not found"),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Activity master updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteActivityMasterController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = Number(req.params.id);
    const deleted = await deleteActivityMaster(id);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Activity master not found"),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Activity master deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
