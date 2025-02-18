import { NextFunction, Request, Response } from "express";
import { addMarksheet, findMarksheetById, saveMarksheet, uploadFile } from "../services/marksheet.service.js";
import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { MarksheetType } from "@/types/academics/marksheet.js";

export const addMultipleMarksheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }

        const fileName = req.file.filename;

        // Set headers for SSE (Server-Sent Events)
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // Periodic function to send messages
        const sendUpdate = (message: string) => {
            res.write(`data: ${message}\n\n`);
        };

        sendUpdate(`Processing started for ${fileName}...`);

        // Process file and get logs in real-time
        const isUploaded = await uploadFile(fileName, sendUpdate);

        sendUpdate(`Processing completed for ${fileName}`);
        res.end();

    } catch (error) {
        res.write(`data: Error: ${(error as Error).message}\n\n`);
        res.end();
        handleError(error, res, next);
    }
};


export const createMarksheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newMarksheet = await addMarksheet(req.body as MarksheetType);
        if (!newMarksheet) {
            res.status(429).json(new ApiError(429, "Unable to create the marksheet!"));
            return;
        }

        res.status(201).json(new ApiResponse(201, "CREATED", newMarksheet, "Marksheet created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getMarksheetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const foundMarksheet = await findMarksheetById(+id);

        if (!foundMarksheet) {
            res.status(404).json(new ApiError(404, "Marksheet not found!"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", foundMarksheet, "Marksheet fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const updatedMarksheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const savedMarksheet = await saveMarksheet(+id, req.body as MarksheetType);

        if (!savedMarksheet) {
            res.status(400).json(new ApiError(404, "Unable to save the marksheet!"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", savedMarksheet, "Marksheet saved successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}