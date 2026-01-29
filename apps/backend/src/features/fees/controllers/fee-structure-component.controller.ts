import { Request, Response } from "express";
import {
  createFeeStructureComponent,
  getAllFeeStructureComponents,
  getFeeStructureComponentById,
  updateFeeStructureComponent,
  deleteFeeStructureComponent,
} from "../services/fee-structure-component.service";
import { createFeeStructureComponentSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";

export async function createFeeStructureComponentHandler(
  req: Request,
  res: Response,
) {
  try {
    const parsed = createFeeStructureComponentSchema.parse(req.body);
    const created = await createFeeStructureComponent(parsed);
    if (!created)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Failed to create fee structure component",
          ),
        );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Fee structure component created successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAllFeeStructureComponentsHandler(
  _req: Request,
  res: Response,
) {
  try {
    const dto = await getAllFeeStructureComponents();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          dto,
          "Fee structure components retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeStructureComponentByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const dto = await getFeeStructureComponentById(id);
    if (!dto)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee structure component with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          dto,
          "Fee structure component retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeStructureComponentHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const partialSchema = createFeeStructureComponentSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated = await updateFeeStructureComponent(id, parsed);
    if (!updated)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee structure component with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee structure component updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeStructureComponentHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const deleted = await deleteFeeStructureComponent(id);
    if (!deleted)
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Fee structure component with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee structure component deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
