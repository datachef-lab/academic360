import { Request, Response, NextFunction, Router } from "express";
import {
  createFeeConcessionSlabHandler,
  deleteFeeConcessionSlabHandler,
  getAllFeeConcessionSlabsHandler,
  getFeeConcessionSlabByIdHandler,
  updateFeeConcessionSlabHandler,
} from "../controllers/fee-concession-slab.controller.js";

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.get("/", asyncHandler(getAllFeeConcessionSlabsHandler));
router.get("/:id", asyncHandler(getFeeConcessionSlabByIdHandler));
router.post("/", asyncHandler(createFeeConcessionSlabHandler));
router.put("/:id", asyncHandler(updateFeeConcessionSlabHandler));
router.delete("/:id", asyncHandler(deleteFeeConcessionSlabHandler));

export default router;
