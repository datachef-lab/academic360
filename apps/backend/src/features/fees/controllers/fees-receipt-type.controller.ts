import { Request, Response } from "express";
import { getFeesReceiptTypes, getFeesReceiptTypeById, createFeesReceiptType, updateFeesReceiptType, deleteFeesReceiptType } from "../services/fees-receipt-type.service.js";
import { handleError } from "@/utils/index.js";

export const getFeesReceiptTypesHandler = async (req: Request, res: Response) => {
    try {
        const feesReceiptTypes = await getFeesReceiptTypes();
        if (feesReceiptTypes === null) {
            handleError(new Error("Error fetching fees receipt types"), res);
            return;
        }
        res.status(200).json(feesReceiptTypes);
    } catch (error) {
        handleError(error, res);
    }
};

export const getFeesReceiptTypeByIdHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const feesReceiptType = await getFeesReceiptTypeById(id);
        if (feesReceiptType === null) {
            handleError(new Error("Error fetching fees receipt type"), res);
            return;
        }
        if (!feesReceiptType) {
            res.status(404).json({ message: "Fees receipt type not found" });
            return;
        }
        res.status(200).json(feesReceiptType);
    } catch (error) {
        handleError(error, res);
    }
};

export const createFeesReceiptTypeHandler = async (req: Request, res: Response) => {
    try {
        const newFeesReceiptType = await createFeesReceiptType(req.body);
        if (newFeesReceiptType === null) {
            handleError(new Error("Error creating fees receipt type"), res);
            return;
        }
        res.status(201).json(newFeesReceiptType);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateFeesReceiptTypeHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updatedFeesReceiptType = await updateFeesReceiptType(id, req.body);
        if (updatedFeesReceiptType === null) {
            handleError(new Error("Error updating fees receipt type"), res);
            return;
        }
        if (!updatedFeesReceiptType) {
            res.status(404).json({ message: "Fees receipt type not found" });
            return;
        }
        res.status(200).json(updatedFeesReceiptType);
    } catch (error) {
        handleError(error, res);
    }
};

export const deleteFeesReceiptTypeHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deletedFeesReceiptType = await deleteFeesReceiptType(id);
        if (deletedFeesReceiptType === null) {
            handleError(new Error("Error deleting fees receipt type"), res);
            return;
        }
        if (!deletedFeesReceiptType) {
            res.status(404).json({ message: "Fees receipt type not found" });
            return;
        }
        res.status(200).json(deletedFeesReceiptType);
    } catch (error) {
        handleError(error, res);
    }
};
