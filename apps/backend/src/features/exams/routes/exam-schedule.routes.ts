import { Router } from "express";
import {
  countStudentsForExam,
  getStudentsForExam,
} from "../controllers/exam-schedule.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = Router();

router.post("/count-students", verifyJWT, countStudentsForExam);
router.post("/get-students", verifyJWT, getStudentsForExam);

export default router;
