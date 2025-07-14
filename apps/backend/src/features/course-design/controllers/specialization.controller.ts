import { Request, Response } from "express";
import { db } from "@/db";
import { specializations } from "../models/specialization.model";
import { eq } from "drizzle-orm";
import { SpecializationSchema } from "@/types/course-design";

export const createSpecialization = async (req: Request, res: Response) => {
  try {
    const specializationData = SpecializationSchema.parse(req.body);
    const newSpecialization = await db.insert(specializations).values(specializationData).returning();
    res.status(201).json(newSpecialization[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllSpecializations = async (_req: Request, res: Response) => {
  try {
    const allSpecializations = await db.select().from(specializations);
    res.json(allSpecializations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSpecializationById = async (req: Request, res: Response) => {
  try {
    const specialization = await db
      .select()
      .from(specializations)
      .where(eq(specializations.id, req.params.id));
    if (!specialization.length) {
      return res.status(404).json({ error: "Specialization not found" });
    }
    res.json(specialization[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSpecialization = async (req: Request, res: Response) => {
  try {
    const specializationData = SpecializationSchema.parse(req.body);
    const updatedSpecialization = await db
      .update(specializations)
      .set(specializationData)
      .where(eq(specializations.id, req.params.id))
      .returning();
    if (!updatedSpecialization.length) {
      return res.status(404).json({ error: "Specialization not found" });
    }
    res.json(updatedSpecialization[0]);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSpecialization = async (req: Request, res: Response) => {
  try {
    const deletedSpecialization = await db
      .delete(specializations)
      .where(eq(specializations.id, req.params.id))
      .returning();
    if (!deletedSpecialization.length) {
      return res.status(404).json({ error: "Specialization not found" });
    }
    res.json({ message: "Specialization deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
