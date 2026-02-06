import { Router } from "express";
import * as feeStructureSlabController from "../controllers/fee-structure-slab.controller.js";

const router = Router();

router.post("/", feeStructureSlabController.createFeeStructureSlab);
router.get("/", feeStructureSlabController.getAllFeeStructureSlabs);
router.get("/:id", feeStructureSlabController.getFeeStructureSlabById);
router.put("/:id", feeStructureSlabController.updateFeeStructureSlab);
router.delete("/:id", feeStructureSlabController.deleteFeeStructureSlab);

export default router;
