import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  createPromotionBuilderHandler,
  deletePromotionBuilderHandler,
  getPromotionBuilderByIdHandler,
  getPromotionBuildersHandler,
  replacePromotionBuilderRulesHandler,
  updatePromotionBuilderHandler,
} from "../controllers/promotion-builder.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get("/", asyncHandler(getPromotionBuildersHandler));
router.get("/:id", asyncHandler(getPromotionBuilderByIdHandler));
router.post("/", asyncHandler(createPromotionBuilderHandler));
router.put("/:id/rules", asyncHandler(replacePromotionBuilderRulesHandler));
router.put("/:id", asyncHandler(updatePromotionBuilderHandler));
router.delete("/:id", asyncHandler(deletePromotionBuilderHandler));

export default router;
