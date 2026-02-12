import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createUserStatusMasterDomainController,
  getUserStatusMasterDomainById,
  getUserStatusMasterDomainsByMasterId,
  updateUserStatusMasterDomainController,
  deleteUserStatusMasterDomainController,
  getAllUserStatusMasterDomainsController,
} from "../controllers/user-status-master-domain.controller.js";

const router = express.Router();

router.use(verifyJWT);

// Create
router.post("/", createUserStatusMasterDomainController);
// Read by ID
router.get("/:id", getUserStatusMasterDomainById);
// Read all for a master
router.get("/master/:masterId", getUserStatusMasterDomainsByMasterId);
// Update
router.put("/:id", updateUserStatusMasterDomainController);
// Delete
router.delete("/:id", deleteUserStatusMasterDomainController);
// Get all
router.get("/", getAllUserStatusMasterDomainsController);

export default router;
