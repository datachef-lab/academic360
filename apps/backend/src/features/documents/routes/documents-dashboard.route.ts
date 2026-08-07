import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  getDocumentsDashboardFeeClearance,
  getDocumentsDashboardHandovers,
  getDocumentsDashboardSummary,
} from "../controllers/documents-dashboard.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/summary", getDocumentsDashboardSummary);
router.get("/handovers", getDocumentsDashboardHandovers);
router.get("/fee-clearance", getDocumentsDashboardFeeClearance);

export default router;
