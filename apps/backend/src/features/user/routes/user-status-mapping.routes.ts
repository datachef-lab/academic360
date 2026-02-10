import express from "express";
import {
  createUserStatusMappingController,
  getUserStatusMappingController,
  getUserStatusMappingsByStudentIdController,
  getAllUserStatusMastersController,
  getPromotionsByStudentIdController,
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
 * POST /user-statuses
 */
router.post("/", createUserStatusMappingController);

/**
 * GET all status masters
 * GET /user-statuses/masters
 */
router.get("/masters", getAllUserStatusMastersController);

/**
 * GET promotions by student
 * GET /user-statuses/student/:studentId/promotions
 */
router.get(
  "/student/:studentId/promotions",
  getPromotionsByStudentIdController,
);

/**
 * GET mappings by student
 * GET /user-statuses/student/:studentId
 */
router.get("/student/:studentId", getUserStatusMappingsByStudentIdController);

/**
 * GET mapping by id
 * GET /user-statuses/:id
 */
router.get("/:id", getUserStatusMappingController);

/**
 * Update mapping
 * PUT /user-statuses/:id
 */
router.put("/:id", updateUserStatusMappingController);

/**
 * Delete mapping
 * DELETE /user-statuses/:id
 */
router.delete("/:id", deleteUserStatusMappingController);

export default router;
