import { Router } from "express";
import {
  updateApaarIdsFromExcel,
  uploadMiddleware,
} from "../controllers/student-apaar-update.controller.js";

const router = Router();

// POST /api/students/update-apaar-ids
// Upload Excel file and update APAAR IDs for students
router.post("/update-apaar-ids", uploadMiddleware, updateApaarIdsFromExcel);

export default router;
