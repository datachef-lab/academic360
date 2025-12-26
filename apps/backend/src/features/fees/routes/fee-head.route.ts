import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeHeadHandler,
  deleteFeeHeadHandler,
  getAllFeeHeadsHandler,
  getFeeHeadByIdHandler,
  updateFeeHeadHandler,
} from "../controllers/fee-head.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get("/", asyncHandler(getAllFeeHeadsHandler));
router.get("/:id", asyncHandler(getFeeHeadByIdHandler));
router.post("/", asyncHandler(createFeeHeadHandler));
router.put("/:id", asyncHandler(updateFeeHeadHandler));
router.delete("/:id", asyncHandler(deleteFeeHeadHandler));

export default router;
