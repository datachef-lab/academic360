import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeHeadHandler,
  deleteFeeHeadHandler,
  getAllFeeHeadsHandler,
  getFeeHeadByIdHandler,
  updateFeeHeadHandler,
} from "../controllers/fee-head.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

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

router.get("/", asyncHandler(getAllFeeHeadsHandler));
router.get("/:id", asyncHandler(getFeeHeadByIdHandler));
router.post("/", asyncHandler(createFeeHeadHandler));
router.put("/:id", asyncHandler(updateFeeHeadHandler));
router.delete("/:id", asyncHandler(deleteFeeHeadHandler));

export default router;
