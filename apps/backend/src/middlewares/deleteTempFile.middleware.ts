import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

export const deleteTempFile = (req: Request, res: Response, next: NextFunction) => {
    console.log("deleteTempFile middleware called");
    console.log("req.file:", req.file);
    if (req.file) {
        const filePath = path.join(directoryName, "../../public/temp", req.file.filename);
        console.log("Attempting to delete file at:", filePath);

        // Wait for the response to be sent, then delete the file
        res.on("finish", () => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${filePath}`, err);
                } else {
                    console.log(`Successfully deleted file: ${filePath}`);
                }
            });
        });
    } else {
        console.log("No file found on req.file, skipping deletion.");
    }

    next();
};
