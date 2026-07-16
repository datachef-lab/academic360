import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import { getLibraryDashboardStatsController } from "@/features/library/controllers/library-dashboard.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/stats", getLibraryDashboardStatsController);
export default router;
