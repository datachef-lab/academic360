import type { Request, Response } from "express";
import { z } from "zod";
import {
  createDisabilityCode,
  getAllDisabilityCodes,
  getDisabilityCodeById,
  updateDisabilityCode,
  deleteDisabilityCode,
} from "../services/disabilityCode.service";
import { createDisabilityCodeSchema } from "@repo/db/schemas/models/user";

// Schema to validate and convert route `id` param to number
const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

/**
 * Handler to create a new disability code.
 */
export async function createDisabilityCodeHandler(req: Request, res: Response) {
  try {
    const parsed = createDisabilityCodeSchema.parse(req.body);
    const created = await createDisabilityCode(parsed);
    return res.status(201).json({ success: true, payload: created });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
}

/**
 * Handler to get all disability codes.
 */
export async function getAllDisabilityCodesHandler(req: Request, res: Response) {
  try {
    const codes = await getAllDisabilityCodes();
    return res.status(200).json({ success: true, payload: codes });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve disability codes",
      error: (error as Error).message,
    });
  }
}

/**
 * Handler to get a disability code by ID.
 */
export async function getDisabilityCodeByIdHandler(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const code = await getDisabilityCodeById(id);
    return res.status(200).json({ success: true, payload: code });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: (error as Error).message,
    });
  }
}

/**
 * Handler to update a disability code.
 */
export async function updateDisabilityCodeHandler(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const parsed = createDisabilityCodeSchema.parse(req.body);
    const updated = await updateDisabilityCode(id, parsed);
    return res.status(200).json({ success: true, payload: updated });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: (error as Error).message,
    });
  }
}

/**
 * Handler to delete a disability code.
 */
export async function deleteDisabilityCodeHandler(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const deleted = await deleteDisabilityCode(id);
    return res.status(200).json({ success: true, payload: deleted });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: (error as Error).message,
    });
  }
}
