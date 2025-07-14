import { Request, Response } from "express";
import { db } from "@/db";
import { examComponents } from "../models/exam-component.model";
import { eq } from "drizzle-orm";
import { ExamComponentSchema } from "@/types/course-design";

export const createExamComponent = async (req: Request, res: Response) => {
  try {
    const examComponentData = ExamComponentSchema.parse(req.body);
    const newExamComponent = await db.insert(examComponents).values({
      ...examComponentData,
      subjectId: req.body.subjectId,
    }).returning();
    res.status(201).json(newExamComponent[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllExamComponents = async (_req: Request, res: Response) => {
  try {
    const allExamComponents = await db.select().from(examComponents);
    res.json(allExamComponents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getExamComponentById = async (req: Request, res: Response) => {
  try {
    const examComponent = await db
      .select()
      .from(examComponents)
      .where(eq(examComponents.id, req.params.id));
    if (!examComponent.length) {
      return res.status(404).json({ error: "Exam Component not found" });
    }
    res.json(examComponent[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateExamComponent = async (req: Request, res: Response) => {
  try {
    const examComponentData = ExamComponentSchema.parse(req.body);
    const updatedExamComponent = await db
      .update(examComponents)
      .set(examComponentData)
      .where(eq(examComponents.id, req.params.id))
      .returning();
    if (!updatedExamComponent.length) {
      return res.status(404).json({ error: "Exam Component not found" });
    }
    res.json(updatedExamComponent[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteExamComponent = async (req: Request, res: Response) => {
  try {
    const deletedExamComponent = await db
      .delete(examComponents)
      .where(eq(examComponents.id, req.params.id))
      .returning();
    if (!deletedExamComponent.length) {
      return res.status(404).json({ error: "Exam Component not found" });
    }
    res.json({ message: "Exam Component deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
