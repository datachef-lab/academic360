import { Request, Response, NextFunction } from "express";
import { db } from "@/db/index.js";
import { specializationModel, createSpecializationSchema } from "@repo/db/schemas/models/course-design";
import { deleteSpecializationSafe } from "@/features/course-design/services/specialization.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { eq } from "drizzle-orm";

// Create specialization
export const createSpecialization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = createSpecializationSchema.parse(req.body);

        const [newSpecialization] = await db
            .insert(specializationModel)
            .values(validatedData)
            .returning();

        res.status(201).json(new ApiResponse(201, "SUCCESS", newSpecialization, "Specialization created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get specialization by ID
export const getSpecializationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const [specialization] = await db
            .select()
            .from(specializationModel)
            .where(eq(specializationModel.id, Number(id)));

        if (!specialization) {
            return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Specialization with ID ${id} not found`));
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", specialization, "Specialization fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all specializations
export const getAllSpecializations = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const specializations = await db.select().from(specializationModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", specializations, "All specializations fetched"));
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update specialization
export const updateSpecialization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;
        const { createdAt, updatedAt, ...rest } = req.body;

        const validatedData = createSpecializationSchema.parse(rest);

        const [updatedSpecialization] = await db
            .update(specializationModel)
            .set(validatedData)
            .where(eq(specializationModel.id, Number(id)))
            .returning();

        if (!updatedSpecialization) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Specialization not found"));
        }

        res.status(200).json(new ApiResponse(200, "UPDATED", updatedSpecialization, "Specialization updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete specialization
export const deleteSpecialization = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;
        const result = await deleteSpecializationSafe(String(id));
        if (!result) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Specialization not found"));
            return;
        }
        res.status(200).json(new ApiResponse(200, "DELETED", result as any, (result as any).message ?? ""));
    } catch (error) {
        handleError(error, res, next);
    }
};
