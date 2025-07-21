import { Request, Response } from "express";
import {
  createSpecialization as createSpecializationService,
  getAllSpecializations as getAllSpecializationsService,
  getSpecializationById as getSpecializationByIdService,
  updateSpecialization as updateSpecializationService,
  deleteSpecialization as deleteSpecializationService,
} from "../services/specialization.service";

export const createSpecialization = async (req: Request, res: Response) => {
  try {
    const newSpecialization = await createSpecializationService(req.body);
    res.status(201).json(newSpecialization);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllSpecializations = async (_req: Request, res: Response) => {
  try {
    const allSpecializations = await getAllSpecializationsService();
    res.json(allSpecializations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSpecializationById = async (req: Request, res: Response) => {
  try {
    const specialization = await getSpecializationByIdService(req.params.id);
    if (!specialization) {
      return res.status(404).json({ error: "Specialization not found" });
    }
    res.json(specialization);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSpecialization = async (req: Request, res: Response) => {
  try {
    const updatedSpecialization = await updateSpecializationService(req.params.id, req.body);
    if (!updatedSpecialization) {
      return res.status(404).json({ error: "Specialization not found" });
    }
    res.json(updatedSpecialization);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSpecialization = async (req: Request, res: Response) => {
  try {
    const deletedSpecialization = await deleteSpecializationService(req.params.id);
    if (!deletedSpecialization) {
      return res.status(404).json({ error: "Specialization not found" });
    }
    res.json({ message: "Specialization deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
