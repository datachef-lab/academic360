import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express, { Request, Response, NextFunction, RequestHandler } from "express";
import { 
  createPersonalDetails, 
  getPersonalDetailsById, 
  getPersonalDetailsByStudentId,
  updatePersonalDetails,
  updatePersonalDetailsByStudentId,
  deletePersonalDetailsById,
  deletePersonalDetailsByStudentId,
  getAllPersonalDetailsController
} from "../controllers/personalDetails.controller.js";

const router = express.Router();

// Helper to wrap async route handlers without using 'any' or 'unknown'
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

// Apply authentication middleware to all routes
// router.use(verifyJWT);

// Get all personal details
router.get("/", asyncHandler(getAllPersonalDetailsController));
// Create personal details
router.post("/", asyncHandler(createPersonalDetails));
// Read personal details by ID
router.get("/:id", asyncHandler(getPersonalDetailsById));
// Read personal details by student ID
router.get("/student/:studentId", asyncHandler(getPersonalDetailsByStudentId));
// Update personal details by ID
router.put("/:id", asyncHandler(updatePersonalDetails));
// Update personal details by student ID
router.put("/student/:studentId", asyncHandler(updatePersonalDetailsByStudentId));
// Delete personal details by ID
router.delete("/:id", asyncHandler(deletePersonalDetailsById));
// Delete personal details by student ID
router.delete("/student/:studentId", asyncHandler(deletePersonalDetailsByStudentId));

export default router;