import { Request, Response } from "express";
import {
  createPaperComponent as createPaperComponentService,
  getAllPaperComponents as getAllPaperComponentsService,
  getPaperComponentById as getPaperComponentByIdService,
  updatePaperComponent as updatePaperComponentService,
  deletePaperComponent as deletePaperComponentService,
} from "../services/paper-component.service";

export const createPaperComponent = async (req: Request, res: Response) => {
  try {
    const newPaperComponent = await createPaperComponentService({
      ...req.body,
      paperId: req.body.paperId,
    });
    res.status(201).json(newPaperComponent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllPaperComponents = async (_req: Request, res: Response) => {
  try {
    const allPaperComponents = await getAllPaperComponentsService();
    res.json(allPaperComponents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaperComponentById = async (req: Request, res: Response) => {
  try {
    const paperComponent = await getPaperComponentByIdService(req.params.id);
    if (!paperComponent) {
      return res.status(404).json({ error: "Paper Component not found" });
    }
    res.json(paperComponent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePaperComponent = async (req: Request, res: Response) => {
  try {
    const updatedPaperComponent = await updatePaperComponentService(req.params.id, {
      ...req.body,
      paperId: req.body.paperId,
    });
    if (!updatedPaperComponent) {
      return res.status(404).json({ error: "Paper Component not found" });
    }
    res.json(updatedPaperComponent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePaperComponent = async (req: Request, res: Response) => {
  try {
    const deletedPaperComponent = await deletePaperComponentService(req.params.id);
    if (!deletedPaperComponent) {
      return res.status(404).json({ error: "Paper Component not found" });
    }
    res.json({ message: "Paper Component deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
