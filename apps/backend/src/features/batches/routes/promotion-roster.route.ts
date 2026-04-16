import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  getCourseDesignCheckHandler,
  getFeeStructureCheckHandler,
  getPromotionRosterBucketCountsHandler,
  getPromotionRosterHandler,
  getPromotionSelectableShiftBreakdownHandler,
  getSelectablePromotionStudentIdsHandler,
  postBulkSemesterPromoteHandler,
  postPromotionShiftBreakdownForSelectionHandler,
} from "../controllers/promotion-roster.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get("/", asyncHandler(getPromotionRosterHandler));
router.get(
  "/bucket-counts",
  asyncHandler(getPromotionRosterBucketCountsHandler),
);
router.get(
  "/selectable-student-ids",
  asyncHandler(getSelectablePromotionStudentIdsHandler),
);
router.get(
  "/selectable-shift-breakdown",
  asyncHandler(getPromotionSelectableShiftBreakdownHandler),
);
router.post(
  "/shift-breakdown-for-selection",
  asyncHandler(postPromotionShiftBreakdownForSelectionHandler),
);
router.post("/promote", asyncHandler(postBulkSemesterPromoteHandler));
router.get("/fee-structure-check", asyncHandler(getFeeStructureCheckHandler));
router.get("/course-design-check", asyncHandler(getCourseDesignCheckHandler));

export default router;
