import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeStructureComponentHandler,
  deleteFeeStructureComponentHandler,
  getAllFeeStructureComponentsHandler,
  getFeeStructureComponentByIdHandler,
  updateFeeStructureComponentHandler,
} from "../controllers/fee-structure-component.controller.js";
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

router.get("/", asyncHandler(getAllFeeStructureComponentsHandler));
router.get("/:id", asyncHandler(getFeeStructureComponentByIdHandler));
router.post("/", asyncHandler(createFeeStructureComponentHandler));
router.put("/:id", asyncHandler(updateFeeStructureComponentHandler));
router.delete("/:id", asyncHandler(deleteFeeStructureComponentHandler));

export default router;
