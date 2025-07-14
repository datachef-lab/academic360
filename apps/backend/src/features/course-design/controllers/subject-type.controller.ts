import { Request, Response } from "express";
import { db } from "@/db";
import { subjectTypes } from "../models/subject-type.model";
import { eq } from "drizzle-orm";
import { SubjectTypeSchema } from "@/types/course-design";

export const createSubjectType = async (req: Request, res: Response) => {
  try {
    const subjectTypeData = SubjectTypeSchema.parse(req.body);
    const newSubjectType = await db.insert(subjectTypes).values(subjectTypeData).returning();
    res.status(201).json(newSubjectType[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllSubjectTypes = async (_req: Request, res: Response) => {
  try {
    const allSubjectTypes = await db.select().from(subjectTypes);
    res.json(allSubjectTypes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubjectTypeById = async (req: Request, res: Response) => {
  try {
    const subjectType = await db
      .select()
      .from(subjectTypes)
      .where(eq(subjectTypes.id, req.params.id));
    if (!subjectType.length) {
      return res.status(404).json({ error: "Subject Type not found" });
    }
    res.json(subjectType[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubjectType = async (req: Request, res: Response) => {
  try {
    const subjectTypeData = SubjectTypeSchema.parse(req.body);
    const updatedSubjectType = await db
      .update(subjectTypes)
      .set(subjectTypeData)
      .where(eq(subjectTypes.id, req.params.id))
      .returning();
    if (!updatedSubjectType.length) {
      return res.status(404).json({ error: "Subject Type not found" });
    }
    res.json(updatedSubjectType[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSubjectType = async (req: Request, res: Response) => {
  try {
    const deletedSubjectType = await db
      .delete(subjectTypes)
      .where(eq(subjectTypes.id, req.params.id))
      .returning();
    if (!deletedSubjectType.length) {
      return res.status(404).json({ error: "Subject Type not found" });
    }
    res.json({ message: "Subject Type deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
