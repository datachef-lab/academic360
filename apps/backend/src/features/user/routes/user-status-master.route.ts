import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createUserStatusMasterController,
  getUserStatusMasterById,
  updateUserStatusMasterController,
  deleteUserStatusMasterController,
  getAllUserStatusMastersController,
} from "../controllers/user-status-master.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create
router.post("/", createUserStatusMasterController);
// Read by ID
router.get("/:id", getUserStatusMasterById);
// Update
router.put("/:id", updateUserStatusMasterController);
// Delete
router.delete("/:id", deleteUserStatusMasterController);
// Get all
router.get("/", getAllUserStatusMastersController);

export default router;
