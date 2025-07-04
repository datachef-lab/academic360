import { Router } from "express";
import * as instalmentController from "../controllers/instalment.controller.js";

const router = Router();

router.post("/", instalmentController.createInstalment);
router.get("/fees-structure/:feesStructureId", instalmentController.getInstalmentsByFeesStructureId);
router.get("/:id", instalmentController.getInstalmentById);
router.put("/:id", instalmentController.updateInstalment);
router.delete("/:id", instalmentController.deleteInstalment);

export default router;
