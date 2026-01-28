import { Router } from "express";
import * as feeStructureSlabController from "../controllers/fee-structure-slab.controller.js";

const router = Router();

router.post("/", feeStructureSlabController.createFeeStructureSlabHandler);
router.get("/", feeStructureSlabController.getAllFeeStructureSlabsHandler);
router.get("/:id", feeStructureSlabController.getFeeStructureSlabByIdHandler);
router.put("/:id", feeStructureSlabController.updateFeeStructureSlabHandler);
router.delete("/:id", feeStructureSlabController.deleteFeeStructureSlabHandler);

export default router;
