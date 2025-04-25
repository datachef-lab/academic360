import { NextFunction, Request, Response } from "express";
import { addPersonalDetails, findPersonalDetailsById, findPersonalDetailsByStudentId } from "../services/personalDetails.service";
import { PersonalDetailsType } from "@/types/user/personal-details";
import { ApiResponse, handleError } from "@/utils/index";

export const createPersonalDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newPersonDetails = await addPersonalDetails(req.body as PersonalDetailsType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newPersonDetails, "New Personal-Details is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getPersonalDetailsById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    try {

        const foundPersonalDetails = await findPersonalDetailsById(Number(id));

        if (!foundPersonalDetails) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Personal Details of ID ${id} not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundPersonalDetails, "New Personal-Details is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getPersonalDetailsByStudentId = async (req: Request, res: Response, next: NextFunction) => {
    const { studentId } = req.query;
    try {
        const foundPersonalDetails = await findPersonalDetailsByStudentId(Number(studentId));
        
        console.log("\n\nfoundPersonalDetails", foundPersonalDetails);
        
        if (!foundPersonalDetails) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Personal Details of Studnet-ID ${studentId} not found`));
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", foundPersonalDetails, "New Personal-Details is added to db!"));

    } catch (error) {
        handleError(error, res, next);
    }
};