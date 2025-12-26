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

export async function createFeeStructureComponentHandler(
  req: Request,
  res: Response,
) {
  try {
    const parsed = createFeeStructureComponentSchema.parse(req.body);
    const result = await createFeeStructureComponent(parsed);
    if (!result.success) return res.status(500).json(result);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAllFeeStructureComponentsHandler(
  _req: Request,
  res: Response,
) {
  try {
    const result = await getAllFeeStructureComponents();
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
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

    const result = await getFeeStructureComponentById(id);
    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
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

    const result = await updateFeeStructureComponent(id, parsed);
    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
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

    const result = await deleteFeeStructureComponent(id);
    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
