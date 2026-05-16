import { Request, Response, NextFunction, Router } from "express";
import {
  getFeeReceiptPdfByChallanHandler,
  postFeeReceiptEnsureHandler,
} from "../controllers/fee-receipt.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.post("/", asyncHandler(postFeeReceiptEnsureHandler));
router.get("/", asyncHandler(getFeeReceiptPdfByChallanHandler));

export default router;
