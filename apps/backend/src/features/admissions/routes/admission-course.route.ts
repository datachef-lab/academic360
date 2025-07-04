import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAdmissionCourseHandler,
  getAdmissionCourseByIdHandler,
  getAdmissionCoursesByAdmissionIdHandler,
  updateAdmissionCourseHandler,
  deleteAdmissionCourseHandler
} from "../controllers/admission-course.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAdmissionCourseHandler);
router.get("/:id", getAdmissionCourseByIdHandler);
router.get("/admission/:admissionId", getAdmissionCoursesByAdmissionIdHandler);
router.put("/:id", updateAdmissionCourseHandler);
router.delete("/:id", deleteAdmissionCourseHandler);

export default router; 