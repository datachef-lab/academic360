import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import { getPromotionRosterHandler } from "../controllers/promotion-roster.controller.js";

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

export default router;
