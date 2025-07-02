import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createStudentAcademicSubjectHandler,
  getStudentAcademicSubjectByIdHandler,
  getStudentAcademicSubjectsByAcademicInfoIdHandler,
  updateStudentAcademicSubjectHandler,
  deleteStudentAcademicSubjectHandler
} from "../controllers/student-academic-subject.controller";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createStudentAcademicSubjectHandler);
router.get("/:id", getStudentAcademicSubjectByIdHandler);
router.get("/academic-info/:academicInfoId", getStudentAcademicSubjectsByAcademicInfoIdHandler);
router.put("/:id", updateStudentAcademicSubjectHandler);
router.delete("/:id", deleteStudentAcademicSubjectHandler);

export default router; 