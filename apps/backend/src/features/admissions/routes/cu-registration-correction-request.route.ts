import { Router } from "express";
import {
  createNewCuRegistrationCorrectionRequest,
  getAllCuRegistrationCorrectionRequests,
  getCuRegistrationCorrectionRequestById,
  getCuRegistrationCorrectionRequestsByStudentId,
  getCuRegistrationCorrectionRequestsByStatus,
  updateCuRegistrationCorrectionRequestById,
  approveCuRegistrationCorrectionRequestById,
  rejectCuRegistrationCorrectionRequestById,
  deleteCuRegistrationCorrectionRequestById,
  getNextCuRegistrationApplicationNumberController,
  validateCuRegistrationApplicationNumberController,
  getCuRegistrationApplicationNumberStatsController,
  exportCuRegistrationCorrectionRequestsController,
} from "../controllers/cu-registration-correction-request.controller.js";
import {
  submitCuRegistrationCorrectionRequestWithDocuments,
  submitPersonalInfoDeclaration,
  submitAddressInfoDeclaration,
  submitSubjectsDeclaration,
  submitDocumentsDeclaration,
} from "../controllers/cu-registration-batch-submit.controller.js";

const router = Router();

// Create a new CU registration correction request
router.post("/", createNewCuRegistrationCorrectionRequest);

// Submit CU registration correction request with documents (batch upload)
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});
router.post(
  "/submit-with-documents",
  upload.array("documents", 10),
  submitCuRegistrationCorrectionRequestWithDocuments,
);

// Declaration endpoints for each tab
router.post("/personal-declaration", submitPersonalInfoDeclaration);
router.post("/address-declaration", submitAddressInfoDeclaration);
router.post("/subjects-declaration", submitSubjectsDeclaration);
router.post("/documents-declaration", submitDocumentsDeclaration);

// Get all CU registration correction requests with pagination and filters
// Query parameters: page, limit, status, studentId, search
router.get("/", getAllCuRegistrationCorrectionRequests);

// Export CU Registration Correction Requests to Excel (must be before /:id route)
router.get("/export", exportCuRegistrationCorrectionRequestsController);

// Get CU registration correction request by ID
router.get("/:id", getCuRegistrationCorrectionRequestById);

// Get CU registration correction requests by student ID
router.get(
  "/student/:studentId",
  getCuRegistrationCorrectionRequestsByStudentId,
);

// Get CU registration correction requests by status
// Query parameters: page, limit
router.get("/status/:status", getCuRegistrationCorrectionRequestsByStatus);

// Update CU registration correction request
router.put("/:id", updateCuRegistrationCorrectionRequestById);

// Approve CU registration correction request
router.patch("/:id/approve", approveCuRegistrationCorrectionRequestById);

// Reject CU registration correction request
router.patch("/:id/reject", rejectCuRegistrationCorrectionRequestById);

// Delete CU registration correction request
router.delete("/:id", deleteCuRegistrationCorrectionRequestById);

// CU Registration Application Number management routes
// Get next available CU Registration Application Number
router.get(
  "/next-application-number",
  getNextCuRegistrationApplicationNumberController,
);

// Validate CU Registration Application Number
router.post(
  "/validate-application-number",
  validateCuRegistrationApplicationNumberController,
);

// Get CU Registration Application Number statistics
router.get(
  "/application-number-stats",
  getCuRegistrationApplicationNumberStatsController,
);

export default router;
