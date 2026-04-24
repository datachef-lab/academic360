import { Router } from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserStatusMappingHandler,
  getStudentPromotionsOverviewHandler,
  getUserStatusMappingsByStudentHandler,
  getUserStatusMastersHandler,
  updateUserStatusMappingHandler,
} from "../controllers/user-status-overview.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/masters", getUserStatusMastersHandler);
router.get(
  "/student/:studentId/promotions",
  getStudentPromotionsOverviewHandler,
);
router.post("/", createUserStatusMappingHandler);
router.put("/:id", updateUserStatusMappingHandler);
router.get("/student/:studentId", getUserStatusMappingsByStudentHandler);

export default router;
