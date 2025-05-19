import { NextFunction, Request, Response } from "express";
import { addMarksheet, findMarksheetById, findMarksheetLogs, getAllMarks, marksheetSummary, saveMarksheet, uploadFile } from "../services/marksheet.service.js";
import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { MarksheetType } from "@/types/academics/marksheet.js";
import { User } from "@/features/user/models/user.model.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { io } from "@/app.js";
import { sendFileUploadNotification, sendEditNotification, sendUpdateNotification } from "@/utils/notificationHelpers.js";

export const addMultipleMarksheet = async (req: Request, res: Response, next: NextFunction) => {
    const socketId = req.body.socketId;
    const socket = io.sockets.sockets.get(socketId as string);
    if (!req.file || !socket) {
        res.status(400).json({ message: "No file uploaded or invalid socket" });
        return;
    }

    try {
        const fileName = req.file.filename;
        console.log(req.user, "user in upload file");
        // Process file and get logs in real-time
        const isUploaded = await uploadFile(fileName, req.user as User, socket);

        socket.emit('progress', {
            stage: 'completed',
            message: 'File processed successfully!',
        });

        // Send real-time notification to all users
        sendFileUploadNotification(req, fileName);

        res.status(200).json(new ApiResponse(200, "SUCCESS", isUploaded, "Marksheets uploaded successfully!"));

        const filePath = path.join(directoryName, "../../../../public/temp", req.file.filename);

        // Wait for the response to be sent, then delete the file
        res.on("finish", () => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${filePath}`, err);
                }
            });
        });

    } catch (error) {
        socket.emit('progress', { stage: 'error', message: 'Error processing file' });
        handleError(error, res, next);
    }
};

const directoryName = path.dirname(fileURLToPath(import.meta.url));

export const createMarksheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newMarksheet = await addMarksheet(req.body as MarksheetType, req.user as User);
        if (!newMarksheet) {
            res.status(429).json(new ApiError(429, "Unable to create the marksheet!"));
            return;
        }

        // Send real-time notification
        sendEditNotification(
            req,
            `Marksheet #${newMarksheet.id}`,
            'Marksheet'
        );

        res.status(201).json(new ApiResponse(201, "CREATED", newMarksheet, "Marksheet created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getAllMarksheets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, pageSize, searchText, stream, year, semester, export: exportFlag } = req.query;

        const marksheets = await getAllMarks(
            Number(page),
            Number(pageSize),
            searchText as string,
            stream as string,
            year ? Number(year) : undefined,
            semester ? Number(semester) : undefined,
            exportFlag === 'true' ? true : false
        );
        if (!marksheets) {
            res.status(404).json(new ApiError(404, "No marksheets found!"));

        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", marksheets, "Marksheets fetched successfully!"));
    }
    catch (error) {
        handleError(error, res, next);
    }
};

export const getMarksheetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("\n\nin fetch by id\n\n");
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

export const getMarksheetsLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, pageSize, searchText } = req.query;

        console.log("\n\n", page, pageSize, searchText, "\n\n")

        const marksheetLogs = await findMarksheetLogs(Number(page), Number(pageSize), searchText as string);

        res.status(200).json(new ApiResponse(200, "SUCCESS", marksheetLogs, "Marksheet Logs fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const updatedMarksheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const savedMarksheet = await saveMarksheet(+id, req.body as MarksheetType, req.user as User);

        if (!savedMarksheet) {
            res.status(400).json(new ApiError(404, "Unable to save the marksheet!"));
            return;
        }

        // Send real-time notification
        sendUpdateNotification(
            req,
            `Marksheet #${id}`,
            'Marksheet'
        );

        res.status(200).json(new ApiResponse(200, "SUCCESS", savedMarksheet, "Marksheet saved successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getMarksheetSummary = async (req: Request, res: Response, next: NextFunction) => {
    const { uid } = req.query as { uid: string | null };

    if (!uid) {
        res.status(429).json(new ApiError(400, "Uid is required!"));
        return;
    }

    try {
        const mksSummary = await marksheetSummary(uid);
        if (!mksSummary) {
            res.status(429).json(new ApiError(429, "Unable to generate the marksheet summary!"));
            return;
        }

        res.status(201).json(new ApiResponse(200, "OK", mksSummary, "Marksheet summary fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}