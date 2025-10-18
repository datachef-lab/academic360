import { Router } from "express";
import { getDynamicSubjectsHandler } from "../controllers/dynamic-subjects.controller.js";

const router = Router();

// GET /api/subject-selection/dynamic-subjects/:studentId
router.get("/:studentId", getDynamicSubjectsHandler);

export default router;
