import { Request, Response } from "express";
import { getFeesStructures, getFeesStructureById, createFeesStructure, updateFeesStructure, deleteFeesStructure, getAcademicYearsFromFeesStructures, getCoursesFromFeesStructures, getFeesStructuresByAcademicYearIdAndCourseId, getFeesDesignAbstractLevel, checkFeesStructureExists } from "../services/fees-structure.service.js";
import { handleError } from "@/utils/index.js";

function toDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string' || typeof val === 'number') return new Date(val);
    return val;
}

function convertAllDates(obj: Record<string, any>, dateFields: string[]): void {
    for (const field of dateFields) {
        if (obj[field]) obj[field] = toDate(obj[field]);
    }
}

export const getFeesStructuresHandler = async (req: Request, res: Response) => {
    try {
        console.log("here")
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
        const body = req.body;
        const dateFields = [
            'startDate', 'endDate', 'closingDate', 'onlineStartDate', 'onlineEndDate',
            'instalmentStartDate', 'instalmentEndDate', 'createdAt', 'updatedAt'
        ];
        convertAllDates(body, dateFields);
        if (Array.isArray(body.components)) {
            for (const comp of body.components) {
                convertAllDates(comp, ['createdAt', 'updatedAt']);
            }
        }
        const newFeesStructure = await createFeesStructure(body);
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
        const body = req.body;
        const dateFields = [
            'startDate', 'endDate', 'closingDate', 'onlineStartDate', 'onlineEndDate',
            'instalmentStartDate', 'instalmentEndDate', 'createdAt', 'updatedAt'
        ];
        convertAllDates(body, dateFields);
        if (Array.isArray(body.components)) {
            for (const comp of body.components) {
                convertAllDates(comp, ['createdAt', 'updatedAt']);
            }
        }
        const updatedFeesStructure = await updateFeesStructure(id, body);
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

export const getAcademicYearsFromFeesStructuresHandler = async (req: Request, res: Response) => {
    try {
        const academicYears = await getAcademicYearsFromFeesStructures();
        res.status(200).json(academicYears);
    } catch (error) {
        handleError(error, res);
    }
};

export const getCoursesFromFeesStructuresHandler = async (req: Request, res: Response) => {
    try {
        const academicYearId = parseInt(req.params.academicYearId);
        const courses = await getCoursesFromFeesStructures(academicYearId);
        res.status(200).json(courses);
    } catch (error) {
        handleError(error, res);
    }
};

export const getFeesStructuresByAcademicYearIdAndCourseIdHandler = async (req: Request, res: Response) => {
    try {
        const academicYearId = parseInt(req.params.academicYearId);
        const courseId = parseInt(req.params.courseId);
        const feesStructures = await getFeesStructuresByAcademicYearIdAndCourseId(academicYearId, courseId);
        res.status(200).json(feesStructures);
    } catch (error) {
        handleError(error, res);
    }
};

export const getFeesDesignAbstractLevelHandler = async (req: Request, res: Response) => {
    try {
        const academicYearId = req.query.academicYearId ? parseInt(req.query.academicYearId as string) : undefined;
        const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
        const abstractLevel = await getFeesDesignAbstractLevel(academicYearId, courseId);
        res.status(200).json(abstractLevel);
    } catch (error) {
        handleError(error, res);
    }
};

export const checkFeesStructureExistsHandler = async (req: Request, res: Response) => {
    try {
        const { academicYearId, courseId, semester, shiftId, feesReceiptTypeId } = req.body;
        if (
            academicYearId == null ||
            courseId == null ||
            semester == null ||
            shiftId == null ||
            feesReceiptTypeId == null
        ) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        const exists = await checkFeesStructureExists(
            Number(academicYearId),
            Number(courseId),
            Number(semester),
            Number(shiftId),
            Number(feesReceiptTypeId)
        );
        res.status(200).json({ exists });
    } catch (error) {
        handleError(error, res);
    }
};
