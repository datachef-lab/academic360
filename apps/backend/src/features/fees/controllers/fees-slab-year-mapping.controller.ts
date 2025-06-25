import { Request, Response } from "express";
import { getFeesSlabYears, getFeesSlabYearById, createFeesSlabYear, updateFeesSlabYear, deleteFeesSlabYear, checkSlabsExistForAcademicYear } from "../services/fees-slab-year-mapping.service";
import { handleError } from "@/utils";

export const getFeesSlabYearMappingsHandler = async (req: Request, res: Response) => {
    try {
        const mappings = await getFeesSlabYears();
        if (mappings === null) {
            handleError(new Error("Error fetching fees slab year mappings"), res);
            return;
        }
        res.status(200).json(mappings);
    } catch (error) {
        handleError(error, res);
    }
};

export const getFeesSlabYearMappingByIdHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const mapping = await getFeesSlabYearById(id);
        if (mapping === null) {
            handleError(new Error("Error fetching fees slab year mapping"), res);
            return;
        }
        if (!mapping) {
            res.status(404).json({ message: "Fees slab year mapping not found" });
            return;
        }
        res.status(200).json(mapping);
    } catch (error) {
        handleError(error, res);
    }
};

export const createFeesSlabYearMappingHandler = async (req: Request, res: Response) => {
    try {
        const newMapping = await createFeesSlabYear(req.body);
        if (newMapping === null) {
            // handleError(new Error("Error creating fees slab year mapping"), res);
            res.status(200).json({ message: "Fees slab year mapping exist" });
            return;
        }
        res.status(201).json(newMapping);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateFeesSlabYearMappingHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updatedMapping = await updateFeesSlabYear(id, req.body);
        if (updatedMapping === null) {
            handleError(new Error("Error updating fees slab year mapping"), res);
            return;
        }
        if (!updatedMapping) {
            res.status(404).json({ message: "Fees slab year mapping not found" });
            return;
        }
        res.status(200).json(updatedMapping);
    } catch (error) {
        handleError(error, res);
    }
};

export const deleteFeesSlabYearMappingHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deletedMapping = await deleteFeesSlabYear(id);
        if (deletedMapping === null) {
            handleError(new Error("Error deleting fees slab year mapping"), res);
            return;
        }
        if (!deletedMapping) {
            res.status(404).json({ message: "Fees slab year mapping not found" });
            return;
        }
        res.status(200).json(deletedMapping);
    } catch (error) {
        handleError(error, res);
    }
};

export const checkSlabsExistForAcademicYearHandler = async (req: Request, res: Response) => {
    try {
        const academicYearId = parseInt(req.params.academicYearId);
        if (isNaN(academicYearId)) {
            res.status(400).json({ message: "Invalid academic year ID" });
            return;
        }
        const result = await checkSlabsExistForAcademicYear(academicYearId);
        res.status(200).json(result);
    } catch (error) {
        handleError(error, res);
    }
};
