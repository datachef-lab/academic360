import { Request, Response, NextFunction, Router } from "express";
import {
  downloadExamFormHandler,
  findPromotionByStudentIdAndClassIdHandler,
  markExamFormSubmissionHandler,
} from "../controllers/promotion.controller";
import { uploadExamFormMiddleware } from "@/middlewares/uploadExamForm.middleware";
import { verifyJWT } from "@/middlewares";
import { exportPromotionStudentsReportHandler } from "../controllers/promotion.controller";

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

router.get(
  "/export",
  verifyJWT,
  asyncHandler(exportPromotionStudentsReportHandler),
);

// Exam-form PDF tunnel — auth is the per-UID HMAC `sig` query param (links
// live inside exported Excel reports where no Bearer header is possible).
router.get("/exam-form/:uid/download", asyncHandler(downloadExamFormHandler));

export default router;
