import { verifyJWT } from "@/middlewares/index.js";
import { Router, Request, Response, NextFunction } from "express";
import {
  getDeclarationForPromotionHandler,
  submitDeclarationHandler,
} from "../controllers/declaration.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(verifyJWT);

router.get(
  "/promotion/:promotionId",
  asyncHandler(getDeclarationForPromotionHandler),
);
router.post("/", asyncHandler(submitDeclarationHandler));

export default router;
