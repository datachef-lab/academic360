import { Request, Response } from "express";
import { db } from "@/db";
import { subjects } from "../models/subject.model";
import { eq } from "drizzle-orm";
import { SubjectSchema } from "@/types/course-design";

export const createSubject = async (req: Request, res: Response) => {
  try {
    const subjectData = SubjectSchema.parse(req.body);
    const newSubject = await db.insert(subjects).values(subjectData).returning();
    res.status(201).json(newSubject[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllSubjects = async (_req: Request, res: Response) => {
  try {
    const allSubjects = await db.select().from(subjects);
    res.json(allSubjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const subject = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, req.params.id));
    if (!subject.length) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json(subject[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const subjectData = SubjectSchema.parse(req.body);
    const updatedSubject = await db
      .update(subjects)
      .set(subjectData)
      .where(eq(subjects.id, req.params.id))
      .returning();
    if (!updatedSubject.length) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json(updatedSubject[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const deletedSubject = await db
      .delete(subjects)
      .where(eq(subjects.id, req.params.id))
      .returning();
    if (!deletedSubject.length) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json({ message: "Subject deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
