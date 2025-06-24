import { Request, Response } from "express";
import { getFeesSlabs, getFeesSlabById, createFeesSlab, updateFeesSlab, deleteFeesSlab } from "../services/fees-slab.service";
import { handleError } from "@/utils";

export const getFeesSlabsHandler = async (req: Request, res: Response) => {
    try {
        const feesSlabs = await getFeesSlabs();
        if (feesSlabs === null) {
            handleError(new Error("Error fetching fees slabs"), res);
            return;
        }
        res.status(200).json(feesSlabs);
    } catch (error) {
        handleError(error, res);
    }
};

export const getFeesSlabByIdHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const feesSlab = await getFeesSlabById(id);
        if (feesSlab === null) {
            handleError(new Error("Error fetching fees slab"), res);
            return;
        }
        if (!feesSlab) {
            res.status(404).json({ message: "Fees slab not found" });
            return;
        }
        res.status(200).json(feesSlab);
    } catch (error) {
        handleError(error, res);
    }
};

export const createFeesSlabHandler = async (req: Request, res: Response) => {
    try {
        const newFeesSlab = await createFeesSlab(req.body);
        if (newFeesSlab === null) {
            handleError(new Error("Error creating fees slab"), res);
            return;
        }
        res.status(201).json(newFeesSlab);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateFeesSlabHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updatedFeesSlab = await updateFeesSlab(id, req.body);
        if (updatedFeesSlab === null) {
            handleError(new Error("Error updating fees slab"), res);
            return;
        }
        if (!updatedFeesSlab) {
            res.status(404).json({ message: "Fees slab not found" });
            return;
        }
        res.status(200).json(updatedFeesSlab);
    } catch (error) {
        handleError(error, res);
    }
};

export const deleteFeesSlabHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deletedFeesSlab = await deleteFeesSlab(id);
        if (deletedFeesSlab === null) {
            handleError(new Error("Error deleting fees slab"), res);
            return;
        }
        if (!deletedFeesSlab) {
            res.status(404).json({ message: "Fees slab not found" });
            return;
        }
        res.status(200).json(deletedFeesSlab);
    } catch (error) {
        handleError(error, res);
    }
};
