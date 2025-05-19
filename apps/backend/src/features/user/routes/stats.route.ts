import express from "express";
import { getStats, getSemesterStatistics } from "@/features/user/controllers/stats.controller.js";

const router = express.Router();

// GET /api/stats - Get all student statistics
router.route("/").get(getStats);

// GET /api/stats/semesters - Get semester-wise student statistics by degree
router.route("/semesters").get(getSemesterStatistics);

export default router; 