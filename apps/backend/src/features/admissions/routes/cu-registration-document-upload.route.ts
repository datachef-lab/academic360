import { Router } from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createNewCuRegistrationDocumentUpload,
  getCuRegistrationDocumentUploadById,
  getCuRegistrationDocumentUploadsByRequestId,
  getAllCuRegistrationDocumentUploads,
  updateCuRegistrationDocumentUploadById,
  deleteCuRegistrationDocumentUploadById,
  deleteCuRegistrationDocumentUploadsByRequestId,
  getSignedUrlForDocument,
  getStudentFiles,
  getStudentFolderStatistics,
  deleteAllStudentFiles,
  uploadMiddleware,
} from "../controllers/cu-registration-document-upload.controller.js";

const router = Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

// Create a new document upload (with file upload)
router.post("/", uploadMiddleware, createNewCuRegistrationDocumentUpload);

// Get all document uploads with pagination and filters
// Query parameters: page, limit, requestId
router.get("/", getAllCuRegistrationDocumentUploads);

// Get document upload by ID
router.get("/:id", getCuRegistrationDocumentUploadById);

// Get signed URL for document access
router.get("/:id/signed-url", getSignedUrlForDocument);

// Get all document uploads for a specific correction request
router.get("/request/:requestId", getCuRegistrationDocumentUploadsByRequestId);

// Update document upload
router.put("/:id", updateCuRegistrationDocumentUploadById);

// Delete document upload
router.delete("/:id", deleteCuRegistrationDocumentUploadById);

// Delete all document uploads for a correction request
router.delete(
  "/request/:requestId",
  deleteCuRegistrationDocumentUploadsByRequestId,
);

// Student folder management routes
// Get all files for a specific student
router.get("/student/:studentUid/files", getStudentFiles);

// Get student folder statistics
router.get("/student/:studentUid/stats", getStudentFolderStatistics);

// Delete all files for a specific student
router.delete("/student/:studentUid/files", deleteAllStudentFiles);

export default router;
