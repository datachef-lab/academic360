import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { createAddressSchema } from "@repo/db/schemas/models/user";
import {
  addAddress,
  findAddressById,
  saveAddress,
  removeAddress,
  getAllAddresses,
} from "@/features/user/services/address.service.js";
import { Address } from "@repo/db/schemas/models/user";

export const createAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parseResult = createAddressSchema.safeParse(req.body);
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
    const newAddress = await addAddress(req.body);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newAddress,
          "New Address is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAddressById = async (
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
    const foundAddress = await findAddressById(id);
    if (!foundAddress) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Address of ID ${id} not found`,
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
          foundAddress,
          "Fetched Address successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const addresses = await getAllAddresses();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          addresses,
          "Fetched all addresses successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateAddress = async (
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
    const parseResult = createAddressSchema.safeParse(req.body);
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
    const updatedAddress = await saveAddress(id, req.body);
    if (!updatedAddress) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Address not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "UPDATED",
          updatedAddress,
          "Address updated successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteAddress = async (
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
    const isDeleted = await removeAddress(id);
    if (isDeleted === null) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Address with ID ${id} not found`,
          ),
        );
      return;
    }
    if (!isDeleted) {
      res
        .status(500)
        .json(new ApiResponse(500, "ERROR", null, "Failed to delete address"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", null, "Address deleted successfully"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
