import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { addFamily, findFamilyById, saveFamily } from "../services/family.service.js";
import { FamilyType } from "@/types/user/family.js";

export const createFamily = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newFamily = await addFamily(req.body as FamilyType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newFamily, "New Family is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getFamilyId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const foundFamily = await findFamilyById(Number(id));

        if (!foundFamily) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Family of ID${id}  not found`));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", foundFamily, "Fetched Family successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateFamily = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const updatedFamily = await saveFamily(Number(id), req.body as FamilyType);

        if (!updatedFamily) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Family not found"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "UPDATED", updatedFamily, "Family updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};
