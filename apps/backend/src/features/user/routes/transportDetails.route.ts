import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createTransportDetails,
  getTransportDetailsById,
  getTransportDetailsByStudentId,
  updateTransportDetailsController,
  deleteTransportDetails,
  deleteTransportDetailsByStudentId,
  getAllTransportDetailsController
} from "../controllers/transportDetails.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create
router.post("/", createTransportDetails);
// Read by ID
router.get("/:id", getTransportDetailsById);
// Read by studentId
router.get("/student/:studentId", getTransportDetailsByStudentId);
// Update
router.put("/:id", updateTransportDetailsController);
// Delete by ID
router.delete("/:id", deleteTransportDetails);
// Delete by studentId
router.delete("/student/:studentId", deleteTransportDetailsByStudentId);
// Get all
router.get("/", getAllTransportDetailsController);

export default router;