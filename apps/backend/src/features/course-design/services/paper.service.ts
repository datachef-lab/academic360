import { db } from "@/db";
import { papers } from "../models/paper.model";
import { eq } from "drizzle-orm";
import { PaperSchema } from "@/types/course-design";
import { z } from "zod";

// Types
export type PaperData = z.infer<typeof PaperSchema>;

// Create a new paper
export const createPaper = async (paperData: PaperData & { subjectId: string }) => {
  const validatedData = PaperSchema.parse(paperData);
  const newPaper = await db.insert(papers).values({
    ...validatedData,
    subjectId: paperData.subjectId,
  }).returning();
  return newPaper[0];
};

// Get all papers
export const getAllPapers = async () => {
  const allPapers = await db.select().from(papers);
  return allPapers;
};

// Get paper by ID
export const getPaperById = async (id: string) => {
  const paper = await db
    .select()
    .from(papers)
    .where(eq(papers.id, id));
  return paper.length > 0 ? paper[0] : null;
};

// Update paper
export const updatePaper = async (id: string, paperData: PaperData & { subjectId: string }) => {
  const validatedData = PaperSchema.parse(paperData);
  const updatedPaper = await db
    .update(papers)
    .set({
      ...validatedData,
      subjectId: paperData.subjectId,
    })
    .where(eq(papers.id, id))
    .returning();
  return updatedPaper.length > 0 ? updatedPaper[0] : null;
};

// Delete paper
export const deletePaper = async (id: string) => {
  const deletedPaper = await db
    .delete(papers)
    .where(eq(papers.id, id))
    .returning();
  return deletedPaper.length > 0 ? deletedPaper[0] : null;
};
