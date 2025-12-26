import { Request, Response } from "express";
import {
  createFeeConcessionSlab,
  getAllFeeConcessionSlabs,
  getFeeConcessionSlabById,
  updateFeeConcessionSlab,
  deleteFeeConcessionSlab,
} from "../services/fee-concession-slab.service";
import { createFeeConcessionSlabSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";

export async function createFeeConcessionSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    // Validate input
    const parsed = createFeeConcessionSlabSchema.parse(req.body);

    const result = await createFeeConcessionSlab(parsed);

    if (!result.success) return res.status(500).json(result);

    return res.status(201).json(result);
  } catch (error) {
    // Zod validation error yields a 400
    // handleError will map and respond accordingly
    return handleError(error, res);
  }
}

export async function getAllFeeConcessionSlabsHandler(
  _req: Request,
  res: Response,
) {
  try {
    const result = await getAllFeeConcessionSlabs();
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeConcessionSlabByIdHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const result = await getFeeConcessionSlabById(id);
    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeConcessionSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    // Validate partial payload
    const partialSchema = createFeeConcessionSlabSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const result = await updateFeeConcessionSlab(id, parsed);
    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeConcessionSlabHandler(
  req: Request,
  res: Response,
) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const result = await deleteFeeConcessionSlab(id);
    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
