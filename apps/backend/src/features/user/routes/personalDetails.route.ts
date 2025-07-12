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
import { verifyJWT } from "@/middlewares/verifyJWT.js"; 

const router = express.Router();

// Helper to wrap async route handlers
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

router.use(verifyJWT);

router.get("/", asyncHandler(getAllPersonalDetailsController));

router.post("/", asyncHandler(createPersonalDetails));

router.get("/student/:studentId", asyncHandler(getPersonalDetailsByStudentId));

router.put("/student/:studentId", asyncHandler(updatePersonalDetailsByStudentId));

router.delete("/student/:studentId", asyncHandler(deletePersonalDetailsByStudentId));

router.get("/:id", asyncHandler(getPersonalDetailsById));

router.put("/:id", asyncHandler(updatePersonalDetails));

router.delete("/:id", asyncHandler(deletePersonalDetailsById));

export default router;
