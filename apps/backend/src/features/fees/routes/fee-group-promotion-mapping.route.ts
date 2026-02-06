import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeGroupPromotionMappingHandler,
  deleteFeeGroupPromotionMappingHandler,
  getAllFeeGroupPromotionMappingsHandler,
  getFeeGroupPromotionMappingByIdHandler,
  getFeeGroupPromotionMappingsByFeeGroupIdHandler,
  getFeeGroupPromotionMappingsByPromotionIdHandler,
  updateFeeGroupPromotionMappingHandler,
  getFilteredFeeGroupPromotionMappingsHandler,
  bulkUploadFeeGroupPromotionMappingsHandler,
} from "../controllers/fee-group-promotion-mapping.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Apply authentication middleware to all routes
router.use(verifyJWT);

router.get("/", asyncHandler(getAllFeeGroupPromotionMappingsHandler));
router.get(
  "/filtered",
  asyncHandler(getFilteredFeeGroupPromotionMappingsHandler),
);
router.get(
  "/fee-group/:feeGroupId",
  asyncHandler(getFeeGroupPromotionMappingsByFeeGroupIdHandler),
);
router.get(
  "/promotion/:promotionId",
  asyncHandler(getFeeGroupPromotionMappingsByPromotionIdHandler),
);
router.get("/:id", asyncHandler(getFeeGroupPromotionMappingByIdHandler));
router.post("/", asyncHandler(createFeeGroupPromotionMappingHandler));
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  asyncHandler(bulkUploadFeeGroupPromotionMappingsHandler),
);
router.put("/:id", asyncHandler(updateFeeGroupPromotionMappingHandler));
router.delete("/:id", asyncHandler(deleteFeeGroupPromotionMappingHandler));

export default router;
