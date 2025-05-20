import express from "express";
import { getStats, getSemesterStatistics, getEnrollmentAnalyticsData, getPassingPercentageStats } from "@/features/user/controllers/stats.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT";

const router = express.Router();
router.use(verifyJWT)
// GET /api/stats 
router.route("/").get(getStats);

// GET /api/stats/semesters 
router.route("/semesters").get(getSemesterStatistics);

// GET /api/stats/enrollment 
router.route("/enrollment").get(getEnrollmentAnalyticsData);

// GET /api/stats/passing-percentage 
router.route("/passing-percentage").get(getPassingPercentageStats);

export default router; 