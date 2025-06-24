import { Request, Response } from "express";
import { getFeesDesignAbstractLevel } from "../services/fees-structure.service";
import { handleError } from "@/utils";

export const getFeesDesignAbstractLevelHandler = async (req: Request, res: Response) => {
    try {
        const { academicYearId, courseId } = req.query;

        const academicYearIdNum = academicYearId ? parseInt(academicYearId as string) : undefined;
        const courseIdNum = courseId ? parseInt(courseId as string) : undefined;

        const data = await getFeesDesignAbstractLevel(academicYearIdNum, courseIdNum);
        res.status(200).json(data);
    } catch (error) {
        handleError(error, res);
    }
}; 