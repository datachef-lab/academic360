import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express, { Request, Response, NextFunction, RequestHandler } from "express";
import {
  createAcademicHistory,
  deleteAcademicHistory,
  getAcademicHistoryById,
  getAcademicHistoryByStudentId,
  getAllAcademicHistory,
  updateAcademicHistory
} from "../controllers/academicHistory.controller.js";

const router = express.Router();
// router.use(verifyJWT);

// Helper to wrap async route handlers without using any or unknown
function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response,
  Next extends NextFunction = NextFunction
>(
  fn: (req: Req, res: Res, next: Next) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    fn(req as Req, res as Res, next as Next).catch(next);
  };
}

// Create academic history
router.post("/", asyncHandler(createAcademicHistory));

// Get all academic histories (with optional pagination)
router.get("/", asyncHandler(getAllAcademicHistory));

// Get academic history by ID
router.get("/:id", asyncHandler(getAcademicHistoryById));

// Get academic history by student ID
router.get("/student/:studentId", asyncHandler(getAcademicHistoryByStudentId));

// Update academic history by ID
router.put("/:id", asyncHandler(updateAcademicHistory));

// Delete academic history by ID
router.delete("/:id", asyncHandler(deleteAcademicHistory));

export default router;