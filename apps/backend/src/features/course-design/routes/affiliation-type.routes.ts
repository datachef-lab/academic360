import { Router } from "express";
import {
  createAffiliationType,
  getAllAffiliationTypes,
  getAffiliationTypeById,
  updateAffiliationType,
  deleteAffiliationType,
} from "../controllers/affiliation-type.controller";
import { RequestHandler } from "express";

const router = Router();

// AffiliationType routes
router.post("/", createAffiliationType as RequestHandler);
router.get("/", getAllAffiliationTypes as RequestHandler);
router.get("/:id", getAffiliationTypeById as RequestHandler);
router.put("/:id", updateAffiliationType as RequestHandler);
router.delete("/:id", deleteAffiliationType as RequestHandler);

export default router;
