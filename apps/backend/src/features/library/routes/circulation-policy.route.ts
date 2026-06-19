import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createCirculationPolicyController,
  deleteCirculationPolicyController,
  getCirculationPolicyByIdController,
  getCirculationPolicyListController,
  resolveCirculationPolicyController,
  updateCirculationPolicyController,
} from "@/features/library/controllers/circulation-policy.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/resolve", resolveCirculationPolicyController);
router.get("/", getCirculationPolicyListController);
router.get("/:id", getCirculationPolicyByIdController);
router.post("/", createCirculationPolicyController);
router.put("/:id", updateCirculationPolicyController);
router.delete("/:id", deleteCirculationPolicyController);

export default router;
