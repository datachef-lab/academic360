import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  listAnalytics,
  recomputeAnalytics,
} from "@/features/library/controllers/student-library-analytics.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", listAnalytics);
router.post("/recompute", recomputeAnalytics);
export default router;
