import { ApiResponse } from "@/utils/ApiResonse.js";
import { NextFunction, Response, Request } from "express";
import { AcademicIdentifier, academicIdentifierModel, createAcademicIdentifierSchema } from "@/features/user/models/academicIdentifier.model.js";
import { db } from "@/db/index.js";
import { handleError } from "@/utils/handleError.js";
import { eq } from "drizzle-orm";
import { addAcademicIdentifier, findAcademicIdentifierById, findAcademicIdentifierByStudentId, saveAcademicIdentifier } from "../services/academicIdentifier.service.js";
import { AcademicHistoryType } from "@/types/user/academic-history.js";
import { AcademicIdentifierType } from "@/types/user/academic-identifier.js";

export const createAcademicIdentifier = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newAcademicIdentifier = await addAcademicIdentifier(req.body as AcademicIdentifierType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newAcademicIdentifier, "New academicIdentifier is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAcademicIdentifierById = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { id } = req.query;

        const foundAcademicIdentifier = await findAcademicIdentifierById(Number(id));

        if (!foundAcademicIdentifier) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicIdentifier of ID${id}  not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundAcademicIdentifier, "Fetched academicIdentifier successfully!"));


    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAcademicIdentifierByStudentId = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { studentId } = req.query;

        const foundAcademicIdentifier = await findAcademicIdentifierByStudentId(Number(studentId));

        if (!foundAcademicIdentifier) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `academicIdentifier of ID${studentId}  not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundAcademicIdentifier, "Fetched academicIdentifier successfully!"));


    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateAcademicIdentifier = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
        res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Fields content can not be empty"));
    }
    try {
        const { id } = req.params;

        const updatedAcademicIdentifier = await saveAcademicIdentifier(Number(id), req.body as AcademicIdentifierType);

        if (!updatedAcademicIdentifier) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "academicIdentifier not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updatedAcademicIdentifier, "AcademicIdentifier updated successfully"));

    } catch (error) {
        handleError(error, res, next);

    }
};