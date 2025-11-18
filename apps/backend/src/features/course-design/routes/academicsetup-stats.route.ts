import { Router } from "express";
import { getAcademicSetupStatsController } from "../controllers/academicsetupStats.controller.js";

const router = Router();

router.get("/", getAcademicSetupStatsController);
router.get("/stats", getAcademicSetupStatsController);

export default router;
