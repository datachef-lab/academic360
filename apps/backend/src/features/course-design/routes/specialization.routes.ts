import { Router } from "express";
import {
  createSpecialization,
  getAllSpecializations,
  getSpecializationById,
  updateSpecialization,
  deleteSpecialization,
} from "../controllers/specialization.controller";
import { RequestHandler } from "express";

const router = Router();

// Specialization routes
router.post("/", createSpecialization as RequestHandler);
router.get("/", getAllSpecializations as RequestHandler);
router.get("/:id", getSpecializationById as RequestHandler);
router.put("/:id", updateSpecialization as RequestHandler);
router.delete("/:id", deleteSpecialization as RequestHandler);

export default router;
