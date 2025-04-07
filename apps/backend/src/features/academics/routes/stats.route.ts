import express from "express";
import { getDashboardStatistics } from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/dashboard", getDashboardStatistics);

export default router; 