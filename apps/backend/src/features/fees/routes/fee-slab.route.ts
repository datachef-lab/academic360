import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeSlabHandler,
  deleteFeeSlabHandler,
  getAllFeeSlabsHandler,
  getFeeSlabByIdHandler,
  updateFeeSlabHandler,
} from "../controllers/fee-slab.controller.js";
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

router.get("/", asyncHandler(getAllFeeSlabsHandler));
router.get("/:id", asyncHandler(getFeeSlabByIdHandler));
router.post("/", asyncHandler(createFeeSlabHandler));
router.put("/:id", asyncHandler(updateFeeSlabHandler));
router.delete("/:id", asyncHandler(deleteFeeSlabHandler));

export default router;
