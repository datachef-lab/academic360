import express from "express";
import { uploadMiddleware } from "@/middlewares/upload.middleware.ts";
import { createMultipleMarksheets } from "../controllers/marksheet.controller.ts";

const router = express.Router();

router.post("/upload", uploadMiddleware, createMultipleMarksheets);

export default router;
