import { NextFunction, Request, Response } from "express";
import {
  getFeesHeads,
  getFeesHeadById,
  createFeesHead,
  updateFeesHead,
  deleteFeesHead,
} from "../services/fees-head.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/index.js";
import { createFeesHeadSchema } from "../models/fees-head.model.js";

export const getFeesHeadsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page = "1", pageSize = "10", search } = req.query;
    const feesHeads = await getFeesHeads(
      Number(page),
      Number(pageSize),
      search ? { search: String(search) } : undefined,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          feesHeads,
          "Fees heads fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getFeesHeadByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id);
    const feesHead = await getFeesHeadById(id);

    if (!feesHead) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Fees head not found"));
      return;
    }

    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", feesHead, "Fees head fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createFeesHeadHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = createFeesHeadSchema.parse(req.body);
    const newFeesHead = await createFeesHead(payload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newFeesHead,
          "Fees head created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateFeesHeadHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id);
    const payload = createFeesHeadSchema.partial().parse(req.body);

    const updatedFeesHead = await updateFeesHead(id, payload);

    if (!updatedFeesHead) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Fees head not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updatedFeesHead,
          "Fees head updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteFeesHeadHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id);
    const deletedFeesHead = await deleteFeesHead(id);

    if (!deletedFeesHead) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Fees head not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          deletedFeesHead,
          "Fees head deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
