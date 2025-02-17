import { NextFunction, Request, Response } from "express";
import { uploadFile } from "../services/marksheet.service.js";
import { handleError } from "@/utils/index.js";

export const addMultipleMarksheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }

        const fileName = req.file.filename; // Get filename from multer

        const isUploaded = await uploadFile(fileName);

        res.status(200).json({
            message: isUploaded ? "File uploaded successfully" : "Unable to upload the file data",
            fileName
        });

    } catch (error) {
        handleError(error, res, next);
    }
};
