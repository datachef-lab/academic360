import { NextFunction, Request, Response } from "express";
import { addMarksheet, findMarksheetById, saveMarksheet, uploadFile } from "../services/marksheet.service.js";
import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { MarksheetType } from "@/types/academics/marksheet.js";
import { User } from "@/features/user/models/user.model.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export const addMultipleMarksheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }

        const fileName = req.file.filename;
        console.log("File Name: ", fileName);

        // // Set headers for SSE (Server-Sent Events)
        // res.setHeader("Content-Type", "text/event-stream");
        // res.setHeader("Cache-Control", "no-cache");
        // res.setHeader("Connection", "keep-alive");

        // // Periodic function to send messages
        // const sendUpdate = (message: string) => {
        //     res.write(`data: ${message}\n\n`);
        // };

        // sendUpdate(`Processing started for ${fileName}...`);

        // Process file and get logs in real-time
        const isUploaded = await uploadFile(fileName, req.user as User);

        // sendUpdate(`Processing completed for ${fileName}`);
        // res.end();

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

        // next();
    } catch (error) {
        handleError(error, res, next);
    }
};

const directoryName = path.dirname(fileURLToPath(import.meta.url));

// export const addMultipleMarksheet = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         if (!req.file) {
//             res.status(400).json({ message: "No file uploaded" });
//             return;
//         }

//         const fileName = req.file.filename;
//         console.log("File Name: ", fileName);

//         // Set headers for SSE (Server-Sent Events)
//         res.setHeader("Content-Type", "text/event-stream");
//         res.setHeader("Cache-Control", "no-cache");
//         res.setHeader("Connection", "keep-alive");

//         // Function to send updates
//         const sendUpdate = (message: string) => {
//             if (!res.writableEnded) {  // Ensure response is open
//                 res.write(`data: ${message}\n\n`);
//             }
//         };

//         sendUpdate(`Processing started for ${fileName}...`);

//         try {
//             // Process file and send real-time updates
//             await uploadFile(fileName, sendUpdate, req.user as User);

//             sendUpdate(`Processing completed for ${fileName}`);
//         } catch (error) {
//             console.error("Processing error:", error);
//             sendUpdate(`Error: ${(error as Error).message}`);
//         } finally {
//             if (!res.writableEnded) res.end();
//         }

//         // 🔹 Ensure the file is deleted after the response is sent
//         res.on("finish", () => {
//             if (req.file) {
//                 const filePath = path.resolve(directoryName, "../../../..", "public", "temp", req.file.filename);
//                 fs.unlink(filePath, (err) => {
//                     if (err) {
//                         console.error(`Error deleting file: ${filePath}`, err);
//                     }
//                 });
//             }
//         });

//     } catch (error) {
//         console.error("Unexpected error:", error);
//         if (!res.headersSent) {
//             res.status(500).json({ message: "Internal server error" });
//         }
//     }
// };



export const createMarksheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newMarksheet = await addMarksheet(req.body as MarksheetType, req.user as User);
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

        const savedMarksheet = await saveMarksheet(+id, req.body as MarksheetType, req.user as User);

        if (!savedMarksheet) {
            res.status(400).json(new ApiError(404, "Unable to save the marksheet!"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", savedMarksheet, "Marksheet saved successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}