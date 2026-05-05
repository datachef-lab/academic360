import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createActivityMasterController,
  deleteActivityMasterController,
  getActivityMasterByIdController,
  getAllActivityMastersController,
  updateActivityMasterController,
} from "../controllers/academic-activity-master.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getAllActivityMastersController);
router.get("/:id", getActivityMasterByIdController);
router.post("/", createActivityMasterController);
router.put("/:id", updateActivityMasterController);
router.delete("/:id", deleteActivityMasterController);

export default router;
