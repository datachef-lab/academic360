import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  deleteFloorPlanController,
  getFloorPlanController,
  listFloorPlansController,
  saveFloorPlanController,
} from "@/features/library/controllers/library-floor-plan.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", listFloorPlansController);
router.get("/:id", getFloorPlanController);
router.post("/", saveFloorPlanController);
router.put("/:id", saveFloorPlanController);
router.delete("/:id", deleteFloorPlanController);
export default router;
