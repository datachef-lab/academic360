import { Request, Response } from "express";
import {
  createPaper as createPaperService,
  getAllPapers as getAllPapersService,
  getPaperById as getPaperByIdService,
  updatePaper as updatePaperService,
  deletePaper as deletePaperService,
} from "../services/paper.service";

export const createPaper = async (req: Request, res: Response) => {
  try {
    const newPaper = await createPaperService({
      ...req.body,
      subjectId: req.body.subjectId,
    });
    res.status(201).json(newPaper);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllPapers = async (_req: Request, res: Response) => {
  try {
    const allPapers = await getAllPapersService();
    res.json(allPapers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaperById = async (req: Request, res: Response) => {
  try {
    const paper = await getPaperByIdService(req.params.id);
    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }
    res.json(paper);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePaper = async (req: Request, res: Response) => {
  try {
    const updatedPaper = await updatePaperService(req.params.id, {
      ...req.body,
      subjectId: req.body.subjectId,
    });
    if (!updatedPaper) {
      return res.status(404).json({ error: "Paper not found" });
    }
    res.json(updatedPaper);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePaper = async (req: Request, res: Response) => {
  try {
    const deletedPaper = await deletePaperService(req.params.id);
    if (!deletedPaper) {
      return res.status(404).json({ error: "Paper not found" });
    }
    res.json({ message: "Paper deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
