import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";
import { fileURLToPath } from "url";
import fs from "fs";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

const tempDir = path.join(directoryName, "../../public/temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Define storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir); // Save files in /public/temp
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

// File filter to allow only Excel files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files are allowed!"));
  }
};

// Multer instance with high limits to prevent 413 errors
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    fieldSize: 50 * 1024 * 1024, // 50MB for form fields
  },
});

// Middleware function
export const uploadExcelMiddleware = upload.single("file"); // 'file' should match frontend form field name
