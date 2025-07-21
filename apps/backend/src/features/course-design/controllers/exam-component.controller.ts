import { Request, Response } from "express";
import {
  createExamComponent as createExamComponentService,
  getAllExamComponents as getAllExamComponentsService,
  getExamComponentById as getExamComponentByIdService,
  updateExamComponent as updateExamComponentService,
  deleteExamComponent as deleteExamComponentService,
} from "../services/exam-component.service";

export const createExamComponent = async (req: Request, res: Response) => {
  try {
    const newExamComponent = await createExamComponentService({
      ...req.body,
      subjectId: req.body.subjectId,
    });
    res.status(201).json(newExamComponent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllExamComponents = async (_req: Request, res: Response) => {
  try {
    const allExamComponents = await getAllExamComponentsService();
    res.json(allExamComponents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getExamComponentById = async (req: Request, res: Response) => {
  try {
    const examComponent = await getExamComponentByIdService(req.params.id);
    if (!examComponent) {
      return res.status(404).json({ error: "Exam Component not found" });
    }
    res.json(examComponent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateExamComponent = async (req: Request, res: Response) => {
  try {
    const updatedExamComponent = await updateExamComponentService(req.params.id, req.body);
    if (!updatedExamComponent) {
      return res.status(404).json({ error: "Exam Component not found" });
    }
    res.json(updatedExamComponent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteExamComponent = async (req: Request, res: Response) => {
  try {
    const deletedExamComponent = await deleteExamComponentService(req.params.id);
    if (!deletedExamComponent) {
      return res.status(404).json({ error: "Exam Component not found" });
    }
    res.json({ message: "Exam Component deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
