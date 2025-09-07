import { Request, Response } from "express";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

export const bulkUploadController = {
  uploadFiles: (req: Request, res: Response) => {
    upload.array("files")(req, res, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: "Files uploaded successfully" });
    });
  },
};
