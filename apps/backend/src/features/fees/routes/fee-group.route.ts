import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeGroupHandler,
  deleteFeeGroupHandler,
  getAllFeeGroupsHandler,
  getFeeGroupByIdHandler,
  updateFeeGroupHandler,
} from "../controllers/fee-group.controller.js";
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

router.get("/", asyncHandler(getAllFeeGroupsHandler));
router.get("/:id", asyncHandler(getFeeGroupByIdHandler));
router.post("/", asyncHandler(createFeeGroupHandler));
router.put("/:id", asyncHandler(updateFeeGroupHandler));
router.delete("/:id", asyncHandler(deleteFeeGroupHandler));

export default router;
