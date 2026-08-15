import express from "express";
import { verifyJWT } from "@/middlewares";
import { getExamDashboardStatsController } from "../controllers/exam-dashboard.controller";

const examDashboardRouter = express.Router();
// Auth-gated, unlike several legacy exam routes — the stats payload aggregates
// candidate and distribution data and must not be publicly readable.
examDashboardRouter.use(verifyJWT);
examDashboardRouter.get("/stats", getExamDashboardStatsController);

export default examDashboardRouter;
