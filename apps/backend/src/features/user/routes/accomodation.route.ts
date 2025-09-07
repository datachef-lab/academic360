import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createAccommodation,
  getAccommodationById,
  getAccommodationByStudentId,
  updateAccommodation,
  deleteAccommodation,
  deleteAccommodationByStudentId,
  getAllAccommodationsController,
} from "../controllers/accommodation.controller.js";

const router = express.Router();

// router.use(verifyJWT);

// Get all
router.get("/", getAllAccommodationsController);
// Create
router.post("/", createAccommodation);
// Get by id
router.get("/:id", getAccommodationById);
// Get by studentId
router.get("/student/:studentId", getAccommodationByStudentId);
// Update
router.put("/:id", updateAccommodation);
// Delete by id
router.delete("/:id", deleteAccommodation);
// Delete by studentId
router.delete("/student/:studentId", deleteAccommodationByStudentId);

export default router;
