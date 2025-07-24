import { Router } from "express";
import {
  createRegulationType,
  getAllRegulationTypes,
  getRegulationTypeById,
  updateRegulationType,
  deleteRegulationType,
} from "../controllers/regulation-type.controller";
import { RequestHandler } from "express";

const router = Router();

// RegulationType routes
router.post("/", createRegulationType as RequestHandler);
router.get("/", getAllRegulationTypes as RequestHandler);
router.get("/:id", getRegulationTypeById as RequestHandler);
router.put("/:id", updateRegulationType as RequestHandler);
router.delete("/:id", deleteRegulationType as RequestHandler);

export default router;
