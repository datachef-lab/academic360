import { Request, Response } from "express";
import {
  createPaperComponent as createPaperComponentService,
  getAllPaperComponents as getAllPaperComponentsService,
  getPaperComponentById as getPaperComponentByIdService,
  updatePaperComponent as updatePaperComponentService,
  deletePaperComponentSafe as deletePaperComponentService,
} from "../services/paper-component.service.js";

export const createPaperComponent = async (req: Request, res: Response) => {
  try {
    const newPaperComponent = await createPaperComponentService({
      ...req.body,
      paperId: req.body.paperId,
    });
    res.status(201).json(newPaperComponent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: errorMessage });
  }
};

export const getAllPaperComponents = async (_req: Request, res: Response) => {
  try {
    const allPaperComponents = await getAllPaperComponentsService();
    res.json(allPaperComponents);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
};

export const getPaperComponentById = async (req: Request, res: Response) => {
  try {
    const paperComponent = await getPaperComponentByIdService(req.params.id);
    if (!paperComponent) {
      return res.status(404).json({ error: "Paper Component not found" });
    }
    res.json(paperComponent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
};

export const updatePaperComponent = async (req: Request, res: Response) => {
  try {
    const updatedPaperComponent = await updatePaperComponentService(req.params.id, {
      ...req.body,
      paperId: req.body.paperId,
    });
    if (!updatedPaperComponent) {
      res.status(404).json({ error: "Paper Component not found" });
      return;
    }
    res.json(updatedPaperComponent);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(400).json({ error: errorMessage });
  }
};

export const deletePaperComponent = async (req: Request, res: Response) => {
  try {
    const result = await deletePaperComponentService(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Paper Component not found" });
      return;
    }
    res.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: errorMessage });
  }
};
