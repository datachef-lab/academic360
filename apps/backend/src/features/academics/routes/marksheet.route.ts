import express from "express";

// import { verifyJWT } from "@/middlewares/verifyJWT.js";

import { addMultipleMarksheet, createMarksheet, getAllMarksheets, getMarksheetById, getMarksheetsLogs, getMarksheetSummary, updatedMarksheet } from "../controllers/marksheet.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";
import { deleteTempFile } from "@/middlewares/deleteTempFile.middleware.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();

// router.use(verifyJWT);

router.post("/upload", verifyJWT, uploadExcelMiddleware, addMultipleMarksheet, deleteTempFile);

router.post("/", verifyJWT, createMarksheet);

router.get("/logs", verifyJWT, getMarksheetsLogs);

router.get("/summary", getMarksheetSummary);

router.get("/query", verifyJWT, getAllMarksheets);

router.get("/:id", verifyJWT, getMarksheetById);


router.put("/:id", verifyJWT, updatedMarksheet);

export default router;
