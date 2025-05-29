import express from "express";
import {
    addMultipleMarksheet,
    createMarksheet,
    getAllMarksheets,
    getMarksheetById,
    getMarksheetByStudentId,
    getMarksheetsLogs,
    getMarksheetSummary,
    refactorSubjectNameC,
    updatedMarksheet,
} from "../controllers/marksheet.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";
import { deleteTempFile } from "@/middlewares/deleteTempFile.middleware.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();

// router.use(verifyJWT);

router.post("/upload", uploadExcelMiddleware, addMultipleMarksheet, deleteTempFile,);

router.post("/refactor-subjectnames", uploadExcelMiddleware, refactorSubjectNameC, deleteTempFile,);

router.post("/",  createMarksheet);

router.get("/logs", getMarksheetsLogs);
router.get("/summary", getMarksheetSummary);

router.get("/query", (req, res, next) => {
    const { id, studentId } = req.query;
    if (id) {
        return getMarksheetById(req, res, next);

    } else if (studentId) {
        return getMarksheetByStudentId(req, res, next);

    } else {
        return getAllMarksheets(req, res, next);
    }
});

router.put("/:id", verifyJWT, updatedMarksheet);

export default router;
