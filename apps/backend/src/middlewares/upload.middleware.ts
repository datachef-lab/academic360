import path from "path";
import multer from "multer";
import { Request } from "express";

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../public/temp")); // Ensure this path exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

// Filter to ensure only Excel files are uploaded
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
        file.mimetype === "application/vnd.ms-excel") {
        cb(null, true);
    } else {
        cb(new Error("Only .xlsx and .xls files are allowed!"));
    }
};

// Set multer configuration
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50 MB
});

export const uploadMiddleware = upload.single("file"); // Expecting a single file with field name 'file'
