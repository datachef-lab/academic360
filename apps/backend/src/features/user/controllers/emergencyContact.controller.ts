import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { createEmergencyContactSchema, EmergencyContact } from "../models/emergencyContact.model.js";
import {
  addEmergencyContact,
  findEmergencyContactById,
  findEmergencyContactByStudentId,
  updateEmergencyContact as updateEmergencyContactService,
  removeEmergencyContact,
  removeEmergencyContactByStudentId,
  getAllEmergencyContacts
} from "../services/emergencyContact.service.js";

export const createEmergencyContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createEmergencyContactSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(new ApiResponse(400, "VALIDATION_ERROR", null, JSON.stringify(parseResult.error.flatten())));
      return;
    }
    const newEmergencyContact = await addEmergencyContact(req.body as EmergencyContact);
    res.status(201).json(new ApiResponse(201, "SUCCESS", newEmergencyContact, "New Emergency Contact is added to db!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getEmergencyContactById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.query.id ?? req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const foundEmergencyContact = await findEmergencyContactById(id);
    if (!foundEmergencyContact) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Emergency Contact of ID ${id} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", foundEmergencyContact, "Fetched Emergency Contact successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getEmergencyContactByStudentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = Number(req.query.studentId ?? req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid student ID format"));
      return;
    }
    const foundEmergencyContact = await findEmergencyContactByStudentId(studentId);
    if (!foundEmergencyContact) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Emergency Contact for student ID ${studentId} not found`));
      return;
    }
    res.status(200).json(new ApiResponse(200, "SUCCESS", foundEmergencyContact, "Fetched Emergency Contact successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateEmergencyContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const parseResult = createEmergencyContactSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json(new ApiResponse(400, "VALIDATION_ERROR", null, JSON.stringify(parseResult.error.flatten())));
      return;
    }
    const updatedEmergencyContact = await updateEmergencyContactService(id, req.body as EmergencyContact);
    if (!updatedEmergencyContact) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Emergency Contact not found"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "UPDATED", updatedEmergencyContact, "Emergency Contact updated successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteEmergencyContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const isDeleted = await removeEmergencyContact(id);
    if (isDeleted === null) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Emergency Contact with ID ${id} not found`));
      return;
    }
    if (!isDeleted) {
      res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete emergency contact"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", null, "Emergency Contact deleted successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteEmergencyContactByStudentId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const studentId = Number(req.params.studentId);
    if (isNaN(studentId)) {
      res.status(400).json(new ApiResponse(400, "INVALID_ID", null, "Invalid student ID format"));
      return;
    }
    const isDeleted = await removeEmergencyContactByStudentId(studentId);
    if (isDeleted === null) {
      res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Emergency Contact for student ID ${studentId} not found`));
      return;
    }
    if (!isDeleted) {
      res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete emergency contact"));
      return;
    }
    res.status(200).json(new ApiResponse(200, "DELETED", null, "Emergency Contact deleted successfully"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllEmergencyContactsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contacts = await getAllEmergencyContacts();
    res.status(200).json(new ApiResponse(200, "SUCCESS", contacts, "Fetched all emergency contacts successfully!"));
  } catch (error) {
    handleError(error, res, next);
  }
};