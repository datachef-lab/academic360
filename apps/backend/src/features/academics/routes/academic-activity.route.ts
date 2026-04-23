import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAcademicActivityController,
  deleteAcademicActivityController,
  getAcademicActivityByIdController,
  getAllAcademicActivitiesController,
  updateAcademicActivityController,
  upsertAcademicActivityController,
  upsertManyAcademicActivitiesController,
} from "../controllers/academic-activity.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Upsert endpoints for console-driven save flows
router.post("/upsert", upsertAcademicActivityController);
router.post("/upsert-many", upsertManyAcademicActivitiesController);

router.get("/", getAllAcademicActivitiesController);
router.get("/:id", getAcademicActivityByIdController);
router.post("/", createAcademicActivityController);
router.put("/:id", updateAcademicActivityController);
router.delete("/:id", deleteAcademicActivityController);

export default router;
