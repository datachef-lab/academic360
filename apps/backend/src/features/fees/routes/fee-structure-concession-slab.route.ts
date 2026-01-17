import { Router } from "express";
import * as feeStructureConcessionSlabController from "../controllers/fee-structure-concession-slab.controller.js";

const router = Router();

router.post(
  "/",
  feeStructureConcessionSlabController.createFeeStructureConcessionSlab,
);
router.get(
  "/",
  feeStructureConcessionSlabController.getAllFeeStructureConcessionSlabs,
);
router.get(
  "/:id",
  feeStructureConcessionSlabController.getFeeStructureConcessionSlabById,
);
router.put(
  "/:id",
  feeStructureConcessionSlabController.updateFeeStructureConcessionSlab,
);
router.delete(
  "/:id",
  feeStructureConcessionSlabController.deleteFeeStructureConcessionSlab,
);

export default router;
