import { Router } from "express";
import {
  getCuRegistrationPdfUrl,
  getCuRegistrationPdfUrlByRequestId,
} from "../controllers/cu-registration-pdf.controller.js";

const router = Router();

// Get PDF URL for correction request (more specific route first)
router.get(
  "/url/request/:correctionRequestId",
  getCuRegistrationPdfUrlByRequestId,
);

// Get PDF URL for student and application number
router.get("/url/:studentId/:applicationNumber", getCuRegistrationPdfUrl);

export default router;
