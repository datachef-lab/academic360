<<<<<<< HEAD
import { Request, Response } from "express";
import {
  createFeeStructureSlab,
  getAllFeeStructureSlabs,
  getFeeStructureSlabById,
  updateFeeStructureSlab,
  deleteFeeStructureSlab,
} from "../services/fee-structure-slab.service.js";
import { createFeeStructureSlabSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";
import { z } from "zod";

export async function createFeeStructureSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const parsed = createFeeStructureSlabSchema.parse(req.body);
    const created = await createFeeStructureSlab(parsed);
    if (!created)
      return res
        .status(500)
        .json(
          new ApiResponse(
            500,
=======
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as feeStructureSlabService from "../services/fee-structure-slab.service.js";
import { createFeeStructureSlabSchema } from "@repo/db/schemas/models/fees";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

export const createFeeStructureSlab = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parse = createFeeStructureSlabSchema.safeParse(
      req.body as z.input<typeof createFeeStructureSlabSchema>,
    );
    if (!parse.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parse.error.flatten()),
          ),
        );
      return;
    }

    const body = parse.data as Omit<
      z.infer<typeof createFeeStructureSlabSchema>,
      "id" | "createdAt" | "updatedAt"
    >;
    const created = await feeStructureSlabService.createFeeStructureSlab(body);

    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
>>>>>>> e94d1577b (update db tables for fees)
            "ERROR",
            null,
            "Failed to create fee structure slab",
          ),
        );
<<<<<<< HEAD

    return res
=======
      return;
    }

    res
>>>>>>> e94d1577b (update db tables for fees)
      .status(201)
      .json(
        new ApiResponse(
          201,
<<<<<<< HEAD
          "SUCCESS",
=======
          "CREATED",
>>>>>>> e94d1577b (update db tables for fees)
          created,
          "Fee structure slab created successfully",
        ),
      );
  } catch (error) {
<<<<<<< HEAD
    return handleError(error, res);
  }
}

export async function getAllFeeStructureSlabsHandler(
  _req: Request,
  res: Response,
) {
  try {
    const rows = await getAllFeeStructureSlabs();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Fee structure slabs retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeStructureSlabByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const row = await getFeeStructureSlabById(id);
    if (!row)
      return res
=======
    handleError(error, res, next);
  }
};

export const getAllFeeStructureSlabs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const all = await feeStructureSlabService.getAllFeeStructureSlabs();

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", all, "Fetched fee structure slabs"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getFeeStructureSlabById = async (
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

    const found = await feeStructureSlabService.getFeeStructureSlabById(id);

    if (!found) {
      res
>>>>>>> e94d1577b (update db tables for fees)
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
<<<<<<< HEAD
            `Fee structure slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Fee structure slab retrieved successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeStructureSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const partialSchema = createFeeStructureSlabSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated = await updateFeeStructureSlab(id, parsed);
    if (!updated)
      return res
=======
            "Fee structure slab not found",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", found, "Fetched fee structure slab"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateFeeStructureSlab = async (
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

    const partialSchema = createFeeStructureSlabSchema.partial();
    const parse = partialSchema.safeParse(
      req.body as z.input<typeof partialSchema>,
    );
    if (!parse.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parse.error.flatten()),
          ),
        );
      return;
    }

    const body = parse.data as Partial<
      z.infer<typeof createFeeStructureSlabSchema>
    >;
    const updated = await feeStructureSlabService.updateFeeStructureSlab(
      id,
      body,
    );

    if (!updated) {
      res
>>>>>>> e94d1577b (update db tables for fees)
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
<<<<<<< HEAD
            `Fee structure slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Fee structure slab updated successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeStructureSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const deleted = await deleteFeeStructureSlab(id);
    if (!deleted)
      return res
=======
            "Fee structure slab not found or update failed",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "UPDATED", updated, "Fee structure slab updated"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteFeeStructureSlab = async (
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

    const deleted = await feeStructureSlabService.deleteFeeStructureSlab(id);

    if (!deleted) {
      res
>>>>>>> e94d1577b (update db tables for fees)
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
<<<<<<< HEAD
            `Fee structure slab with ID ${id} not found`,
          ),
        );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          deleted,
          "Fee structure slab deleted successfully",
        ),
      );
  } catch (error) {
    return handleError(error, res);
  }
}
=======
            "Fee structure slab not found or delete failed",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "DELETED", deleted, "Fee structure slab deleted"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
>>>>>>> e94d1577b (update db tables for fees)
