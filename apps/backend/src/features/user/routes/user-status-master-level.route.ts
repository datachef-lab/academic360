import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createUserStatusMasterLevelController,
  getUserStatusMasterLevelById,
  getUserStatusMasterLevelsByMasterId,
  updateUserStatusMasterLevelController,
  deleteUserStatusMasterLevelController,
  getAllUserStatusMasterLevelsController,
} from "../controllers/user-status-master-level.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create
router.post("/", createUserStatusMasterLevelController);
// Read by ID
router.get("/:id", getUserStatusMasterLevelById);
// Read all for a master
router.get("/master/:masterId", getUserStatusMasterLevelsByMasterId);
// Update
router.put("/:id", updateUserStatusMasterLevelController);
// Delete
router.delete("/:id", deleteUserStatusMasterLevelController);
// Get all
router.get("/", getAllUserStatusMasterLevelsController);

export default router;
