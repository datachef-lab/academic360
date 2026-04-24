import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  createPromotionStatusHandler,
  deletePromotionStatusHandler,
  getPromotionStatusByIdHandler,
  getPromotionStatusesHandler,
  updatePromotionStatusHandler,
} from "../controllers/promotion-status.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get("/", asyncHandler(getPromotionStatusesHandler));
router.get("/:id", asyncHandler(getPromotionStatusByIdHandler));
router.post("/", asyncHandler(createPromotionStatusHandler));
router.put("/:id", asyncHandler(updatePromotionStatusHandler));
router.delete("/:id", asyncHandler(deletePromotionStatusHandler));

export default router;
