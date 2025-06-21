import { Request, Response } from "express";
import { getFeesStructures, getFeesStructureById, createFeesStructure, updateFeesStructure, deleteFeesStructure } from "../services/fees-structure.service";
import { handleError } from "@/utils";

export const getFeesStructuresHandler = async (req: Request, res: Response) => {
    try {
        const feesStructures = await getFeesStructures();
        if (feesStructures === null) {
            handleError(new Error("Error fetching fees structures"), res);
            return;
        }
        res.status(200).json(feesStructures);
    } catch (error) {
        handleError(error, res);
    }
};

export const getFeesStructureByIdHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const feesStructure = await getFeesStructureById(id);
        if (feesStructure === null) {
            handleError(new Error("Error fetching fees structure"), res);
            return;
        }
        if (!feesStructure) {
            res.status(404).json({ message: "Fees structure not found" });
            return;
        }
        res.status(200).json(feesStructure);
    } catch (error) {
        handleError(error, res);
    }
};

export const createFeesStructureHandler = async (req: Request, res: Response) => {
    try {
        const newFeesStructure = await createFeesStructure(req.body);
        if (newFeesStructure === null) {
            handleError(new Error("Error creating fees structure"), res);
            return;
        }
        res.status(201).json(newFeesStructure);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateFeesStructureHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updatedFeesStructure = await updateFeesStructure(id, req.body);
        if (updatedFeesStructure === null) {
            handleError(new Error("Error updating fees structure"), res);
            return;
        }
        if (!updatedFeesStructure) {
            res.status(404).json({ message: "Fees structure not found" });
            return;
        }
        res.status(200).json(updatedFeesStructure);
    } catch (error) {
        handleError(error, res);
    }
};

export const deleteFeesStructureHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deletedFeesStructure = await deleteFeesStructure(id);
        if (deletedFeesStructure === null) {
            handleError(new Error("Error deleting fees structure"), res);
            return;
        }
        if (!deletedFeesStructure) {
            res.status(404).json({ message: "Fees structure not found" });
            return;
        }
        res.status(200).json(deletedFeesStructure);
    } catch (error) {
        handleError(error, res);
    }
};
