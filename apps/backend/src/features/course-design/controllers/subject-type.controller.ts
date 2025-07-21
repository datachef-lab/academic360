import { Request, Response } from "express";
import {
  createSubjectType as createSubjectTypeService,
  getAllSubjectTypes as getAllSubjectTypesService,
  getSubjectTypeById as getSubjectTypeByIdService,
  updateSubjectType as updateSubjectTypeService,
  deleteSubjectType as deleteSubjectTypeService,
} from "../services/subject-type.service";

export const createSubjectType = async (req: Request, res: Response) => {
  try {
    const newSubjectType = await createSubjectTypeService(req.body);
    res.status(201).json(newSubjectType);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllSubjectTypes = async (_req: Request, res: Response) => {
  try {
    const allSubjectTypes = await getAllSubjectTypesService();
    res.json(allSubjectTypes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubjectTypeById = async (req: Request, res: Response) => {
  try {
    const subjectType = await getSubjectTypeByIdService(req.params.id);
    if (!subjectType) {
      return res.status(404).json({ error: "Subject Type not found" });
    }
    res.json(subjectType);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSubjectType = async (req: Request, res: Response) => {
  try {
    const updatedSubjectType = await updateSubjectTypeService(req.params.id, req.body);
    if (!updatedSubjectType) {
      return res.status(404).json({ error: "Subject Type not found" });
    }
    res.json(updatedSubjectType);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSubjectType = async (req: Request, res: Response) => {
  try {
    const deletedSubjectType = await deleteSubjectTypeService(req.params.id);
    if (!deletedSubjectType) {
      return res.status(404).json({ error: "Subject Type not found" });
    }
    res.json({ message: "Subject Type deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
