import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeCategoryPromotionMappingHandler,
  deleteFeeCategoryPromotionMappingHandler,
  getAllFeeCategoryPromotionMappingsHandler,
  getFeeCategoryPromotionMappingByIdHandler,
  getFeeCategoryPromotionMappingsByFeeCategoryIdHandler,
  getFeeCategoryPromotionMappingsByPromotionIdHandler,
  updateFeeCategoryPromotionMappingHandler,
  getFilteredFeeCategoryPromotionMappingsHandler,
  bulkUploadFeeCategoryPromotionMappingsHandler,
} from "../controllers/fee-category-promotion-mapping.controller.js";
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

router.get("/", asyncHandler(getAllFeeCategoryPromotionMappingsHandler));
router.get(
  "/filtered",
  asyncHandler(getFilteredFeeCategoryPromotionMappingsHandler),
);
router.get(
  "/fee-category/:feeCategoryId",
  asyncHandler(getFeeCategoryPromotionMappingsByFeeCategoryIdHandler),
);
router.get(
  "/promotion/:promotionId",
  asyncHandler(getFeeCategoryPromotionMappingsByPromotionIdHandler),
);

router.get("/:id", asyncHandler(getFeeCategoryPromotionMappingByIdHandler));
router.post("/", asyncHandler(createFeeCategoryPromotionMappingHandler));
router.post(
  "/bulk-upload",
  uploadExcelMiddleware,
  asyncHandler(bulkUploadFeeCategoryPromotionMappingsHandler),
);

router.put("/:id", asyncHandler(updateFeeCategoryPromotionMappingHandler));
router.delete("/:id", asyncHandler(deleteFeeCategoryPromotionMappingHandler));

export default router;
