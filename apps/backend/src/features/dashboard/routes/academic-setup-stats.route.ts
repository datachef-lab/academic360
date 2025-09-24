import { Router } from "express";
import {
  getStatsByAcademicYear,
  getStatsGroupedByAcademicYear,
} from "../controllers/academic-setup-stats.controller.js";

const router = Router();

router.get("/:academicYearId", getStatsByAcademicYear);
router.get("/", getStatsGroupedByAcademicYear);

export default router;
