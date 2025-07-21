import { Request, Response } from "express";
import {
  createSubject as createSubjectService,
  getAllSubjects as getAllSubjectsService,
  getSubjectById as getSubjectByIdService,
  updateSubject as updateSubjectService,
  deleteSubject as deleteSubjectService,
} from "../services/subject.service";

export const createSubject = async (req: Request, res: Response) => {
  try {
    const newSubject = await createSubjectService(req.body);
    res.status(201).json(newSubject);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllSubjects = async (_req: Request, res: Response) => {
  try {
    const allSubjects = await getAllSubjectsService();
    res.json(allSubjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const subject = await getSubjectByIdService(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json(subject);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const updatedSubject = await updateSubjectService(req.params.id, req.body);
    if (!updatedSubject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json(updatedSubject);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const deletedSubject = await deleteSubjectService(req.params.id);
    if (!deletedSubject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json({ message: "Subject deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
