import { Request, Response } from "express";
import { db } from "@/db";
import { papers } from "../models/paper.model";
import { eq } from "drizzle-orm";
import { PaperSchema } from "@/types/course-design";

export const createPaper = async (req: Request, res: Response) => {
  try {
    const paperData = PaperSchema.parse(req.body);
    const newPaper = await db.insert(papers).values({
      ...paperData,
      subjectId: req.body.subjectId,
    }).returning();
    res.status(201).json(newPaper[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllPapers = async (_req: Request, res: Response) => {
  try {
    const allPapers = await db.select().from(papers);
    res.json(allPapers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaperById = async (req: Request, res: Response) => {
  try {
    const paper = await db
      .select()
      .from(papers)
      .where(eq(papers.id, req.params.id));
    if (!paper.length) {
      return res.status(404).json({ error: "Paper not found" });
    }
    res.json(paper[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePaper = async (req: Request, res: Response) => {
  try {
    const paperData = PaperSchema.parse(req.body);
    const updatedPaper = await db
      .update(papers)
      .set({
        ...paperData,
        subjectId: req.body.subjectId,
      })
      .where(eq(papers.id, req.params.id))
      .returning();
    if (!updatedPaper.length) {
      return res.status(404).json({ error: "Paper not found" });
    }
    res.json(updatedPaper[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePaper = async (req: Request, res: Response) => {
  try {
    const deletedPaper = await db
      .delete(papers)
      .where(eq(papers.id, req.params.id))
      .returning();
    if (!deletedPaper.length) {
      return res.status(404).json({ error: "Paper not found" });
    }
    res.json({ message: "Paper deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
