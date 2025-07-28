import { Router, RequestHandler } from "express";
import {
  createRegulationTypeHandler,
  deleteRegulationTypeHandler,
  getAllRegulationTypesHandler,
  getRegulationTypeByIdHandler,
  updateRegulationTypeHandler,
  bulkUploadRegulationTypesHandler
} from "../controllers/regulation-type.controller";
import { uploadExcelMiddleware } from "@/middlewares/uploadMiddleware.middleware";

const router = Router();

router.post("/", createRegulationTypeHandler as RequestHandler);
router.post("/bulk-upload", uploadExcelMiddleware, bulkUploadRegulationTypesHandler as RequestHandler);
router.get("/", getAllRegulationTypesHandler as RequestHandler);
router.get("/:id", getRegulationTypeByIdHandler as RequestHandler);
router.put("/:id", updateRegulationTypeHandler as RequestHandler);
router.delete("/:id", deleteRegulationTypeHandler as RequestHandler);

export default router;
