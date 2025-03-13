import { NextFunction, Response, Request } from "express";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { createParentSchema, parentModel } from "../models/parent.model.js";
import { addParent, findParentById, saveParent } from "../services/parentDetails.service.js";
import { ParentType } from "@/types/user/parent.js";

export const createParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newParent = await addParent(req.body as ParentType);
//hm
        res.status(201).json(new ApiResponse(201, "SUCCESS", newParent, "New Parent is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getParentId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const foundParent = await findParentById(Number(id));

        if (!foundParent) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Parent of ID${id}  not found`));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", foundParent, "Fetched Parent successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateParent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const updatedParent = await saveParent(Number(id), req.body as ParentType);

        if (!updatedParent) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Parent not found"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "UPDATED", updatedParent, "Parent updated successfully"));

    } catch (error) {
        handleError(error, res, next);
    }
};
