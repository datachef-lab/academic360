import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { db } from "@/db";
import { studentModel } from "@repo/db/schemas";
import { eq } from "drizzle-orm";

const baseUploadPath = process.env.EXAM_FORM_UPLOAD_PATH;

if (!baseUploadPath) {
  throw new Error("EXAM_FORM_UPLOAD_PATH not defined in .env");
}

// Ensure directory exists
if (!fs.existsSync(baseUploadPath)) {
  fs.mkdirSync(baseUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, baseUploadPath);
  },

  filename: (req: Request, file, cb) => {
    const promotionId = req.params.promotionId;
    const userId = (req as any).user?.id;
    const ext = path.extname(file.originalname);

    db.select()
      .from(studentModel)
      .where(eq(studentModel.userId, userId))
      .then(([foundStudent]) => {
        const fileName = foundStudent
          ? `${foundStudent.uid}${ext}`
          : `exam-form-${promotionId}-student-${userId}${ext}`;

        cb(null, fileName);
      })
      .catch((err) => {
        cb(err, "");
      });
  },
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};

export const uploadExamFormMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single("examForm"); // must match frontend
