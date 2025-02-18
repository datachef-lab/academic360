import { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";

export const deleteTempFile = (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
        const filePath = path.join(__dirname, "../../public/temp", req.file.filename);

        // Wait for the response to be sent, then delete the file
        res.on("finish", () => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${filePath}`, err);
                }
            });
        });
    }

    next();
};
