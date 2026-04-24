import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  createPromotionClauseHandler,
  deletePromotionClauseHandler,
  getPromotionClauseByIdHandler,
  getPromotionClausesHandler,
  replacePromotionClauseClassMappingsHandler,
  updatePromotionClauseHandler,
} from "../controllers/promotion-clause.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get("/", asyncHandler(getPromotionClausesHandler));
router.get("/:id", asyncHandler(getPromotionClauseByIdHandler));
router.post("/", asyncHandler(createPromotionClauseHandler));
router.put("/:id", asyncHandler(updatePromotionClauseHandler));
router.put(
  "/:id/class-mappings",
  asyncHandler(replacePromotionClauseClassMappingsHandler),
);
router.delete("/:id", asyncHandler(deletePromotionClauseHandler));

export default router;
