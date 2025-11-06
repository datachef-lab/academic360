import { Router } from "express";
import {
  getCuRegistrationPdfUrl,
  getCuRegistrationPdfUrlByRequestId,
  proxyCuRegistrationPdf,
} from "../controllers/cu-registration-pdf.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = Router();

// Proxy endpoint to serve PDF with iframe-friendly headers
// Note: Authentication is handled inside the controller to support both header and cookie-based auth
router.get("/proxy/request/:correctionRequestId", proxyCuRegistrationPdf);

// Handle OPTIONS request for CORS preflight
router.options("/proxy/request/:correctionRequestId", (req, res) => {
  let requestOrigin = req.get("origin");
  if (!requestOrigin) {
    const referer = req.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        requestOrigin = refererUrl.origin;
      } catch (e) {
        requestOrigin = "*";
      }
    } else {
      requestOrigin = "*";
    }
  }
  res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(204).end();
});

// Get PDF URL for correction request (more specific route first)
router.get(
  "/url/request/:correctionRequestId",
  getCuRegistrationPdfUrlByRequestId,
);

// Get PDF URL for student and application number
router.get("/url/:studentId/:applicationNumber", getCuRegistrationPdfUrl);

export default router;
