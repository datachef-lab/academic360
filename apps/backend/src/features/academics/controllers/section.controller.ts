import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";

import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { sectionModel } from "@repo/db/schemas/models/academics";

const parseId = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const bodyToInput = (body: Record<string, unknown>) => ({
  name: typeof body.name === "string" ? body.name.trim() : "",
  sequence:
    body.sequence == null || body.sequence === ""
      ? null
      : Number(body.sequence),
  isActive: typeof body.isActive === "boolean" ? body.isActive : true,
});

export const getAllSectionsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sections = await db.select().from(sectionModel);
    res.status(200).json({ payload: sections });
  } catch (error) {
    next(error);
  }
};

export const createSectionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = bodyToInput(req.body as Record<string, unknown>);
    if (!input.name) throw new ApiError(400, "Section name is required.");
    const [row] = await db
      .insert(sectionModel)
      .values({
        name: input.name,
        sequence:
          input.sequence != null && Number.isFinite(input.sequence)
            ? input.sequence
            : undefined,
        isActive: input.isActive,
      })
      .returning();
    res.status(201).json({ payload: row });
  } catch (e) {
    next(e);
  }
};

export const updateSectionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid section id.");
    const input = bodyToInput(req.body as Record<string, unknown>);
    if (!input.name) throw new ApiError(400, "Section name is required.");
    const [row] = await db
      .update(sectionModel)
      .set({
        name: input.name,
        sequence:
          input.sequence != null && Number.isFinite(input.sequence)
            ? input.sequence
            : null,
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(sectionModel.id, id))
      .returning();
    if (!row) throw new ApiError(404, "Section not found.");
    res.status(200).json({ payload: row });
  } catch (e) {
    next(e);
  }
};

export const deleteSectionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid section id.");
    await db.delete(sectionModel).where(eq(sectionModel.id, id));
    res.status(200).json({ payload: null });
  } catch (e) {
    next(e);
  }
};
