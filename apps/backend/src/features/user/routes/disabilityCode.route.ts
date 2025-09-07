import { Request, Response, NextFunction, Router } from "express";
import {
  createDisabilityCodeHandler,
  getAllDisabilityCodesHandler,
  getDisabilityCodeByIdHandler,
  updateDisabilityCodeHandler,
  deleteDisabilityCodeHandler,
} from "../controllers/disabilityCode.controller";

const router = Router();

// Utility to wrap async route handlers
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.post("/", asyncHandler(createDisabilityCodeHandler));

router.get("/", asyncHandler(getAllDisabilityCodesHandler));

router.get("/:id", asyncHandler(getDisabilityCodeByIdHandler));

router.put("/:id", asyncHandler(updateDisabilityCodeHandler));

router.delete("/:id", asyncHandler(deleteDisabilityCodeHandler));

export default router;
