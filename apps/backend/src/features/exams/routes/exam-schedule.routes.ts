import { Router } from "express";
import {
  countStudentsForExam,
  createExamAssignmenthandler,
  getStudentsForExam,
} from "../controllers/exam-schedule.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { createExamAssignment } from "../services/exam-schedule.service.js";

const router = Router();

router.post("/count-students", verifyJWT, countStudentsForExam);
router.post("/get-students", verifyJWT, getStudentsForExam);
router.post("/", verifyJWT, createExamAssignmenthandler);

export default router;
