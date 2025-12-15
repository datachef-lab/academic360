import { Router } from "express";
import {
  countStudentsForExam,
  createExamAssignmenthandler,
  downloadAdmitCardsController,
  downloadExamCandidatesController,
  downloadSingleAdmitCardController,
  getAllExamsController,
  getExamByIdController,
  getExamPapersByExamIdController,
  getExamsByStudentController,
  getStudentsForExam,
  updateExamSubjectHandler,
} from "../controllers/exam-schedule.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { createExamAssignment } from "../services/exam-schedule.service.js";

const router = Router();

router.post("/count-students", verifyJWT, countStudentsForExam);
router.post("/get-students", verifyJWT, getStudentsForExam);

router.put("/exam-subject", verifyJWT, updateExamSubjectHandler);

router.get("/download-admit-cards", verifyJWT, downloadAdmitCardsController);
router.post("/", verifyJWT, createExamAssignmenthandler);
router.get("/exam-candidates/download", downloadExamCandidatesController);
router.get("/", getAllExamsController);
router.get("/admit-card/download/single", downloadSingleAdmitCardController);
router.get("/:id", getExamByIdController);
router.get("/exam-papers/:id", getExamPapersByExamIdController);
/**
 * Get paginated exams for a student
 */
router.get("/student/:studentId/exams", getExamsByStudentController);

export default router;
