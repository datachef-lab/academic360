import { Router, RequestHandler } from "express";
import {
  createStudentSubjectSelectionsHandler,
  updateStudentSubjectSelectionsHandler,
  getStudentSubjectSelectionsHandler,
  getStudentSubjectSelectionByIdHandler,
  deleteStudentSubjectSelectionHandler,
  getSubjectSelectionMetaHandler,
  getVersionHistoryHandler,
  getCurrentActiveSelectionsHandler,
  getAuditTrailHandler,
  canCreateSelectionsHandler,
  getSelectionStatisticsHandler,
} from "../controllers/student-subject-selection.controller.js";

const router = Router();

// Get subject selection meta data for UI form
router.get(
  "/meta/:studentId",
  getSubjectSelectionMetaHandler as RequestHandler,
);

// Create multiple subject selections with validation
router.post("/", createStudentSubjectSelectionsHandler as RequestHandler);

// Update multiple subject selections with validation
router.put(
  "/:studentId/:sessionId",
  updateStudentSubjectSelectionsHandler as RequestHandler,
);

// Get paginated student subject selections
router.get("/", getStudentSubjectSelectionsHandler as RequestHandler);

// Get student subject selection by ID
router.get("/:id", getStudentSubjectSelectionByIdHandler as RequestHandler);

// Delete student subject selection
router.delete("/:id", deleteStudentSubjectSelectionHandler as RequestHandler);

// -- Version History and Audit Trail Routes --

// Get version history for a student's subject selections
router.get("/history/:studentId", getVersionHistoryHandler as RequestHandler);

// Get current active selections for a student
router.get(
  "/active/:studentId",
  getCurrentActiveSelectionsHandler as RequestHandler,
);

// Get audit trail for a specific subject selection
router.get(
  "/audit/:studentId/:subjectSelectionMetaId",
  getAuditTrailHandler as RequestHandler,
);

// Check if student can create new selections
router.get(
  "/can-create/:studentId/:sessionId",
  canCreateSelectionsHandler as RequestHandler,
);

// Get selection statistics for reporting
router.get(
  "/statistics/:studentId",
  getSelectionStatisticsHandler as RequestHandler,
);

export default router;
