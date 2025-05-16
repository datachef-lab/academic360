import express from "express";

// import { verifyJWT } from "@/middlewares/verifyJWT.js";

import { addMultipleMarksheet, createMarksheet, getAllMarksheets, getMarksheetById, getMarksheetsLogs, updatedMarksheet } from "../controllers/marksheet.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";
import { deleteTempFile } from "@/middlewares/deleteTempFile.middleware.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/upload", uploadExcelMiddleware, addMultipleMarksheet, deleteTempFile);

router.post("/", createMarksheet);

router.get("/logs", getMarksheetsLogs);
router.get("/query", getAllMarksheets);

router.get("/:id", getMarksheetById);


router.put("/:id", updatedMarksheet);

export default router;
