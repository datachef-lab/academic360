import express from "express";
import { createSubjectHandler, deleteSubjectHandler, getAllSubjectsHandler, getSubjectByIdHandler, updateSubjectHandler, bulkUploadSubjectsHandler } from "../../course-design/controllers/subject.controller.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";
// import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();
// router.use(verifyJWT);
router.post("/", createSubjectHandler);
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadSubjectsHandler);
router.get("/", getAllSubjectsHandler);
router.get("/query", (req, res, next) => {
    const { id } = req.query;
    if (id) {
        getSubjectByIdHandler(req, res, next);
    } else {
        getAllSubjectsHandler(req, res, next);
    }
});
router.put("/query", updateSubjectHandler);
router.delete("/query", deleteSubjectHandler);

export default router; 