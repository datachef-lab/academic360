import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createUserStatusMasterFrequencyController,
  getUserStatusMasterFrequencyById,
  getUserStatusMasterFrequenciesByMasterId,
  updateUserStatusMasterFrequencyController,
  deleteUserStatusMasterFrequencyController,
  getAllUserStatusMasterFrequenciesController,
} from "../controllers/user-status-master-frequency.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create
router.post("/", createUserStatusMasterFrequencyController);
// Read by ID
router.get("/:id", getUserStatusMasterFrequencyById);
// Read all for a master
router.get("/master/:masterId", getUserStatusMasterFrequenciesByMasterId);
// Update
router.put("/:id", updateUserStatusMasterFrequencyController);
// Delete
router.delete("/:id", deleteUserStatusMasterFrequencyController);
// Get all
router.get("/", getAllUserStatusMasterFrequenciesController);

export default router;
