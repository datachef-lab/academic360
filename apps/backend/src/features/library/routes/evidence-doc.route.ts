import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createEvidenceDocController,
  deleteEvidenceDocController,
  getEvidenceDoc,
  listEvidenceDocs,
  updateEvidenceDocController,
} from "@/features/library/controllers/evidence-doc.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", listEvidenceDocs);
router.get("/:id", getEvidenceDoc);
router.post("/", createEvidenceDocController);
router.put("/:id", updateEvidenceDocController);
router.delete("/:id", deleteEvidenceDocController);
export default router;
