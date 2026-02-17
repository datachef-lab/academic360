import { Request, Response, NextFunction, Router } from "express";
import {
  findPromotionByStudentIdAndClassIdHandler,
  markExamFormSubmissionHandler,
} from "../controllers/promotion.controller";
import { uploadExamFormMiddleware } from "@/middlewares/uploadExamForm.middleware";
import { verifyJWT } from "@/middlewares";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get(
  "/student/:studentId/class/:classId",
  asyncHandler(findPromotionByStudentIdAndClassIdHandler),
);

router.post(
  "/:promotionId/mark-exam-form-submitted",
  verifyJWT,
  uploadExamFormMiddleware,
  asyncHandler(markExamFormSubmissionHandler),
);

export default router;
