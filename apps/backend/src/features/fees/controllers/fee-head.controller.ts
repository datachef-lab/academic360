import { Request, Response } from "express";
import {
  createFeeHead,
  getAllFeeHeads,
  getFeeHeadById,
  updateFeeHead,
  deleteFeeHead,
} from "../services/fee-head.service";
import { createFeeHeadSchema } from "@repo/db/schemas";
import { handleError } from "@/utils";

export async function createFeeHeadHandler(req: Request, res: Response) {
  try {
    const parsed = createFeeHeadSchema.parse(req.body);
    const result = await createFeeHead(parsed);
    if (!result.success) return res.status(500).json(result);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getAllFeeHeadsHandler(_req: Request, res: Response) {
  try {
    const result = await getAllFeeHeads();
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function getFeeHeadByIdHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const result = await getFeeHeadById(id);
    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function updateFeeHeadHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const partialSchema = createFeeHeadSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const result = await updateFeeHead(id, parsed);
    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}

export async function deleteFeeHeadHandler(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });

    const result = await deleteFeeHead(id);
    if (!result.success) {
      const isNotFound = result.message.includes("not found");
      return res.status(isNotFound ? 404 : 500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res);
  }
}
