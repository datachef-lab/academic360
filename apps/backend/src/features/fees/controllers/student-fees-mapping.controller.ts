import { Request, Response } from "express";
import { getStudentFeesMappings, getStudentFeesMappingById, createStudentFeesMapping, updateStudentFeesMapping, deleteStudentFeesMapping } from "../services/student-fees-mapping.service";
import { handleError } from "@/utils";

export const getStudentFeesMappingsHandler = async (req: Request, res: Response) => {
    try {
        const studentFeesMappings = await getStudentFeesMappings();
        if (studentFeesMappings === null) {
            handleError(new Error("Error fetching student fees mappings"), res);
            return;
        }
        res.status(200).json(studentFeesMappings);
    } catch (error) {
        handleError(error, res);
    }
};

export const getStudentFeesMappingByIdHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const studentFeesMapping = await getStudentFeesMappingById(id);
        if (studentFeesMapping === null) {
            handleError(new Error("Error fetching student fees mapping"), res);
            return;
        }
        if (!studentFeesMapping) {
            res.status(404).json({ message: "Student fees mapping not found" });
            return;
        }
        res.status(200).json(studentFeesMapping);
    } catch (error) {
        handleError(error, res);
    }
};

export const createStudentFeesMappingHandler = async (req: Request, res: Response) => {
    try {
        const newStudentFeesMapping = await createStudentFeesMapping(req.body);
        if (newStudentFeesMapping === null) {
            handleError(new Error("Error creating student fees mapping"), res);
            return;
        }
        res.status(201).json(newStudentFeesMapping);
    } catch (error) {
        handleError(error, res);
    }
};

export const updateStudentFeesMappingHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const updatedStudentFeesMapping = await updateStudentFeesMapping(id, req.body);
        if (updatedStudentFeesMapping === null) {
            handleError(new Error("Error updating student fees mapping"), res);
            return;
        }
        if (!updatedStudentFeesMapping) {
            res.status(404).json({ message: "Student fees mapping not found" });
            return;
        }
        res.status(200).json(updatedStudentFeesMapping);
    } catch (error) {
        handleError(error, res);
    }
};

export const deleteStudentFeesMappingHandler = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deletedStudentFeesMapping = await deleteStudentFeesMapping(id);
        if (deletedStudentFeesMapping === null) {
            handleError(new Error("Error deleting student fees mapping"), res);
            return;
        }
        if (!deletedStudentFeesMapping) {
            res.status(404).json({ message: "Student fees mapping not found" });
            return;
        }
        res.status(200).json(deletedStudentFeesMapping);
    } catch (error) {
        handleError(error, res);
    }
};
