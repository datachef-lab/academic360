import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createEvidenceDocController,
  deleteEvidenceDocController,
  getEvidenceDoc,
  getEvidenceDocPresignedUrl,
  listEvidenceDocs,
  updateEvidenceDocController,
  uploadEvidenceDocFileMiddleware,
} from "@/features/library/controllers/evidence-doc.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", listEvidenceDocs);
router.get("/:id/url", getEvidenceDocPresignedUrl);
router.get("/:id", getEvidenceDoc);
router.post("/", uploadEvidenceDocFileMiddleware, createEvidenceDocController);
router.put(
  "/:id",
  uploadEvidenceDocFileMiddleware,
  updateEvidenceDocController,
);
router.delete("/:id", deleteEvidenceDocController);
export default router;
