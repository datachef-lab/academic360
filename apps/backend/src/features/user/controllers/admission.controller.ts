// import { NextFunction, Response, Request } from "express";
// import { handleError } from "@/utils/handleError.js";
// import { ApiResponse } from "@/utils/ApiResonse.js";
// import { db } from "@/db/index.js";
// import { eq } from "drizzle-orm";
// import { Admission, admissionModel, createAdmissionSchema } from "../models/admission.model.js";
// import { addAdmission, findAdmissionById, saveAdmission } from "../services/admission.service.js";
// import { findAll } from "@/utils/helper.js";

// export const createAdmission = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const newAddmission = await addAdmission(req.body as Admission);

//         res.status(201).json(new ApiResponse(201, "SUCCESS", newAddmission, "New Admission is added to db!"));

//     } catch (error) {
//         handleError(error, res, next);
//     }
// };

// export const getAdmissionById = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { id } = req.query;

//         const foundAdmission = await findAdmissionById(Number(id));

//         if (!foundAdmission) {
//             res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, `Admission of ID${id}  not found`));
//             return;
//         }

//         res.status(200).json(new ApiResponse(200, "SUCCESS", foundAdmission, "Fetched Admission successfully!"));

//     } catch (error) {
//         handleError(error, res, next);
//     }
// };

// export const getAllAdmission = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { page, pageSize } = req.query;

//         const records = await findAll(admissionModel, Number(page), Number(pageSize));

//         res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Fetched all Admission!"));

//     } catch (error) {
//         handleError(error, res, next);
//     }
// };

// export const updateAdmission = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { id } = req.query;

//         const updatedAdmission = await saveAdmission(Number(id), req.body as Admission);

//         if (!updatedAdmission) {
//             res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Admission not found"));
//         }
//         res.status(200).json(new ApiResponse(200, "UPDATED", updatedAdmission, "Admission updated successfully"));

//     } catch (error) {
//         handleError(error, res, next);
//     }
// };
