import { Request, Response } from "express";
import { db } from "@/db";
import { paperComponents } from "../models/paper-component.model";
import { eq } from "drizzle-orm";
import { PaperComponentSchema } from "@/types/course-design";

export const createPaperComponent = async (req: Request, res: Response) => {
  try {
    const paperComponentData = PaperComponentSchema.parse(req.body);
    const newPaperComponent = await db.insert(paperComponents).values({
      ...paperComponentData,
      paperId: req.body.paperId,
    }).returning();
    res.status(201).json(newPaperComponent[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllPaperComponents = async (_req: Request, res: Response) => {
  try {
    const allPaperComponents = await db.select().from(paperComponents);
    res.json(allPaperComponents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaperComponentById = async (req: Request, res: Response) => {
  try {
    const paperComponent = await db
      .select()
      .from(paperComponents)
      .where(eq(paperComponents.id, req.params.id));
    if (!paperComponent.length) {
      return res.status(404).json({ error: "Paper Component not found" });
    }
    res.json(paperComponent[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePaperComponent = async (req: Request, res: Response) => {
  try {
    const paperComponentData = PaperComponentSchema.parse(req.body);
    const updatedPaperComponent = await db
      .update(paperComponents)
      .set({
        ...paperComponentData,
        paperId: req.body.paperId,
      })
      .where(eq(paperComponents.id, req.params.id))
      .returning();
    if (!updatedPaperComponent.length) {
      return res.status(404).json({ error: "Paper Component not found" });
    }
    res.json(updatedPaperComponent[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePaperComponent = async (req: Request, res: Response) => {
  try {
    const deletedPaperComponent = await db
      .delete(paperComponents)
      .where(eq(paperComponents.id, req.params.id))
      .returning();
    if (!deletedPaperComponent.length) {
      return res.status(404).json({ error: "Paper Component not found" });
    }
    res.json({ message: "Paper Component deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
