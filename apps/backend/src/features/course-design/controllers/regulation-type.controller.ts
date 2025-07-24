import { Request, Response } from "express";
import {
  createRegulationType as createRegulationTypeService,
  getAllRegulationTypes as getAllRegulationTypesService,
  getRegulationTypeById as getRegulationTypeByIdService,
  updateRegulationType as updateRegulationTypeService,
  deleteRegulationType as deleteRegulationTypeService,
} from "../services/regulation-type.service";

export const createRegulationType = async (req: Request, res: Response) => {
  try {
    const newRegulationType = await createRegulationTypeService(req.body);
    res.status(201).json(newRegulationType);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllRegulationTypes = async (_req: Request, res: Response) => {
  try {
    const allRegulationTypes = await getAllRegulationTypesService();
    res.json(allRegulationTypes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRegulationTypeById = async (req: Request, res: Response) => {
  try {
    const regulationType = await getRegulationTypeByIdService(req.params.id);
    if (!regulationType) {
      return res.status(404).json({ error: "RegulationType not found" });
    }
    res.json(regulationType);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRegulationType = async (req: Request, res: Response) => {
  try {
    const updatedRegulationType = await updateRegulationTypeService(req.params.id, req.body);
    if (!updatedRegulationType) {
      return res.status(404).json({ error: "RegulationType not found" });
    }
    res.json(updatedRegulationType);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteRegulationType = async (req: Request, res: Response) => {
  try {
    const deletedRegulationType = await deleteRegulationTypeService(req.params.id);
    if (!deletedRegulationType) {
      return res.status(404).json({ error: "RegulationType not found" });
    }
    res.json({ message: "RegulationType deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
