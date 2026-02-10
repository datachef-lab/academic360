import express from "express";
import {
  createUserStatusMappingController,
  updateUserStatusMappingController,
  deleteUserStatusMappingController,
} from "../controllers/user-status-mapping.controller.js";

import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();

/**
 * Protect ALL routes
 */
router.use(verifyJWT);

/**
 * Create mapping
 * POST /user-status-mappings
 */
router.post("/", createUserStatusMappingController);

/**
 * GET mapping
 * PUT /user-status-mappings/:id
 */
router.get("/:id", updateUserStatusMappingController);

/**
 * Update mapping
 * PUT /user-status-mappings/:id
 */
router.put("/:id", updateUserStatusMappingController);

/**
 * Delete mapping
 * DELETE /user-status-mappings/:id
 */
router.delete("/:id", deleteUserStatusMappingController);

export default router;
