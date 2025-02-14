import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { addGuardian, findGuardianById, saveGuardian } from "../services/guardian.service.js";
import { GuardianType } from "@/types/user/guardian.js";

export const createGuardian = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newGuardian = await addGuardian(req.body as GuardianType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newGuardian, "New Guardian is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getGuardianById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const foundGuardian = await findGuardianById(Number(id));

        if (!foundGuardian) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Guardian of ID${id}  not found`));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", foundGuardian, "Fetched Guardian successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateGuardian = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const updatedGuardian = await saveGuardian(Number(id), req.body as GuardianType);

        if (!updatedGuardian) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Guardian not found"));
            return;
        }
        
        res.status(200).json(new ApiResponse(200, "UPDATED", updatedGuardian, "Guardian updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};