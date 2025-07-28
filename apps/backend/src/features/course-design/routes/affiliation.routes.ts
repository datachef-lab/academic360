import { Router } from "express";
import {
  createAffiliationHandler,
  deleteAffiliationHandler,
  getAllAffiliationsHandler,
  getAffiliationByIdHandler,
  updateAffiliationHandler,
  bulkUploadAffiliationsHandler
} from "../controllers/affiliation.controller";
import { RequestHandler } from "express";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware";

const router = Router();

// Affiliation routes
router.post("/", createAffiliationHandler as RequestHandler);
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadAffiliationsHandler as RequestHandler);
router.get("/", getAllAffiliationsHandler as RequestHandler);
router.get("/:id", getAffiliationByIdHandler as RequestHandler);
router.put("/:id", updateAffiliationHandler as RequestHandler);
router.delete("/:id", deleteAffiliationHandler as RequestHandler);

export default router; 