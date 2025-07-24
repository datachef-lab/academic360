import express from "express";
import { createSubjectHandler, deleteSubjectHandler, getAllSubjectsHandler, getSubjectByIdHandler, updateSubjectHandler } from "../../course-design/controllers/subject.controller.js";
// import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();
// router.use(verifyJWT);
router.post("/", createSubjectHandler);
router.get("/", getAllSubjectsHandler);
router.get("/query", (req, res, next) => {
    const { id } = req.query;
    if (id) {
        getSubjectByIdHandler(req, res, next);
    } else {
        getAllSubjectsHandler(req, res, next);
    }
});
// router.put("/query", updateSubjectHandler);
// router.delete("/query", deleteSubjectHandler);

export default router; 