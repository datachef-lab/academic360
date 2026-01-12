import { NextFunction, Response, Router } from "express";
import {
  allotExamRoomsAndStudentsController,
  checkDuplicateExamController,
  countStudentsForExam,
  createExamAssignmenthandler,
  downloadAdmitCardsController,
  downloadAttendanceSheetsByExamIdController,
  downloadExamCandidatesController,
  downloadSingleAdmitCardController,
  getAllExamsController,
  getEligibleRoomsController,
  getExamByIdController,
  getExamCandiatesByStudentIdAndExamIdController,
  getExamPapersByExamIdController,
  getExamsByStudentController,
  getStudentsForExam,
  triggerExamCandidatesEmailController,
  updateExamSubjectHandler,
} from "../controllers/exam-schedule.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { createExamAssignment } from "../services/exam-schedule.service.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

router.post(
  "/count-students",
  verifyJWT,
  uploadExcelMiddleware,
  countStudentsForExam,
);
router.post(
  "/get-students",
  verifyJWT,
  uploadExcelMiddleware,
  getStudentsForExam,
);

router.put("/exam-subject", verifyJWT, updateExamSubjectHandler);

router.get("/download-admit-cards", verifyJWT, downloadAdmitCardsController);
router.get(
  "/download-attendance-sheets",
  verifyJWT,
  downloadAttendanceSheetsByExamIdController,
);
router.get(
  "/send-admit-cards",
  verifyJWT,
  triggerExamCandidatesEmailController,
);

router.post("/", verifyJWT, uploadExcelMiddleware, createExamAssignmenthandler);
router.get("/exam-candidates/download", downloadExamCandidatesController);
router.get("/", getAllExamsController);
// router.post("/student/:studentId", verifyJWT, uploadExcelMiddleware, getExamsByStudentController);
router.get("/admit-card/download/single", downloadSingleAdmitCardController);
router.get("/candidates", getExamCandiatesByStudentIdAndExamIdController);
router.get("/exam-papers/:id", getExamPapersByExamIdController);
/**
 * Get paginated exams for a student
 */
router.get("/student/:studentId/exams", getExamsByStudentController);

/**
 * Check for duplicate exam
 */
router.post("/check-duplicate", verifyJWT, checkDuplicateExamController);

/**
 * Get eligible rooms based on exam schedule
 */
router.post("/eligible-rooms", verifyJWT, getEligibleRoomsController);

/**
 * Allot rooms and students to an existing exam
 * IMPORTANT: This route must come before /:id to avoid route conflicts
 */
router.post(
  "/:examId/allot",
  verifyJWT,
  uploadExcelMiddleware,
  allotExamRoomsAndStudentsController,
);

router.get("/:id", getExamByIdController);

export default router;
