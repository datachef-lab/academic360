import { Request, Response } from "express";
import * as feesSlabService from "../services/fees-slab.service.js";
import { handleError } from "@/utils/index.js";

export const getAllFeesSlabs = async (req: Request, res: Response) => {
    const slabs = await feesSlabService.getAllFeesSlabs();
    console.log("fees slabs:", slabs)
    if (slabs === null) {
        handleError(new Error("Error fetching fees slabs"), res);
        return;
    }
    res.status(200).json(slabs);
};

export const getFeesSlabById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const slab = await feesSlabService.getFeesSlabById(id);
        if (slab === null) {
            handleError(new Error("Error fetching fees slab"), res);
            return;
        }
        if (!slab) {
            res.status(404).json({ message: "Fees slab not found" });
            return;
        }
        res.status(200).json(slab);
    } catch (error) {
        handleError(error, res);
    }
};

export const createFeesSlab = async (req: Request, res: Response) => {
    try {
        const newSlab = await feesSlabService.createFeesSlab(req.body);
        if (newSlab === null) {
            handleError(new Error("Error creating fees slab"), res);
            return;
        }
        res.status(201).json(newSlab);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateFeesSlab = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updated = await feesSlabService.updateFeesSlab(id, req.body);
        if (updated === null) {
            handleError(new Error("Error updating fees slab"), res);
            return;
        }
        if (!updated) {
            res.status(404).json({ message: "Fees slab not found" });
            return;
        }
        res.status(200).json(updated);
    } catch (error) {
        handleError(error, res);
    }
};

export const deleteFeesSlab = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await feesSlabService.deleteFeesSlab(id);
        if (deleted === null) {
            handleError(new Error("Error deleting fees slab"), res);
            return;
        }
        if (!deleted) {
            res.status(404).json({ message: "Fees slab not found" });
            return;
        }
        res.status(204).send();
    } catch (error) {
        handleError(error, res);
    }
};

export const checkSlabsExistForAcademicYear = async (academicYearId: number) => {
    try {
        const slabs = await feesSlabService.getFeesSlabsByAcademicYear(academicYearId);
        return { exists: Array.isArray(slabs) && slabs.length > 0 };
    } catch (error) {
        console.error("Error checking slabs existence:", error);
        return { exists: false };
    }
};
