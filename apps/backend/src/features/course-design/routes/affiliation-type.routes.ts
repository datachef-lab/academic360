import { Router } from "express";
import {
  createAffiliationTypeHandler,
  deleteAffiliationTypeHandler,
  getAllAffiliationTypesHandler,
  getAffiliationTypeByIdHandler,
  updateAffiliationTypeHandler,
  bulkUploadAffiliationTypesHandler
} from "../controllers/affiliation-type.controller.js";
import { RequestHandler } from "express";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware.js";

const router = Router();

// Affiliation Type routes
router.post("/", createAffiliationTypeHandler as RequestHandler);
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadAffiliationTypesHandler as RequestHandler);
router.get("/", getAllAffiliationTypesHandler as RequestHandler);
router.get("/:id", getAffiliationTypeByIdHandler as RequestHandler);
router.put("/:id", updateAffiliationTypeHandler as RequestHandler);
router.delete("/:id", deleteAffiliationTypeHandler as RequestHandler);

export default router;
