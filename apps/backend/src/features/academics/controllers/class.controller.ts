import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import {
    createClass,
    getAllClasses,
    findClassById,
    updateClass,
    deleteClass
} from "../services/class.service.js";

export const createClassController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newClass = await createClass(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", newClass, "Class created successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllClassesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const classes = await getAllClasses();
        res.status(200).json(new ApiResponse(200, "SUCCESS", classes, "Classes fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getClassByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const foundClass = await findClassById(id);
        if (!foundClass) {
            res.status(404).json(new ApiResponse(404, "FAIL", null, "Class not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundClass, "Class fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateClassController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const updatedClass = await updateClass(id, req.body);
        if (!updatedClass) {
            res.status(404).json(new ApiResponse(404, "FAIL", null, "Class not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", updatedClass, "Class updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteClassController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteClass(id);
        if (!deleted) {
            res.status(404).json(new ApiResponse(404, "FAIL", null, "Class not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Class deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
}; 