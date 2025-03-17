import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createHealthDetails,
  deleteHealthDetails,
  getAllHealthDetails,
  getHealthDetailsById,
  getHealthDetailsByStudentId,
  updateHealthDetails,
} from "../controllers/health.controller";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createHealthDetails);
router.get("/", getAllHealthDetails);
router.get("/:id", getHealthDetailsById);
router.get("/student/:studentId", getHealthDetailsByStudentId );
router.put("/:id", updateHealthDetails);
router.delete("/:id", deleteHealthDetails);
export default router;
