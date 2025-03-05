import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import { createAcademicHistory, deleteAcademicHistory, getAcademicHistoryById, getAcademicHistoryByStudentId, getAllAcademicHistory, updateAcademicHistory } from "../controllers/academicHistory.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.post("/", createAcademicHistory);
router.get("/", getAllAcademicHistory);
router.get("/query", (req, res, next) => {
    const { id ,studentId} = req.query;
    console.log(id);
    if (id) {
        getAcademicHistoryById(req, res, next);
    }else if(studentId){
        getAcademicHistoryByStudentId(req, res, next);
//3sdkj
    } else {
        getAllAcademicHistory(req, res, next);
    }
});
router.put("/:id", updateAcademicHistory);
router.delete("/:id", deleteAcademicHistory);

export default router;