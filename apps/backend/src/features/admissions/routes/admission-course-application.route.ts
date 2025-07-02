import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAdmissionCourseApplicationHandler,
  getAdmissionCourseApplicationByIdHandler,
  getAdmissionCourseApplicationsByApplicationFormIdHandler,
  updateAdmissionCourseApplicationHandler,
  deleteAdmissionCourseApplicationHandler
} from "../controllers/admission-course-application.controller";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAdmissionCourseApplicationHandler);
router.get("/:id", getAdmissionCourseApplicationByIdHandler);
router.get("/application-form/:applicationFormId", getAdmissionCourseApplicationsByApplicationFormIdHandler);
router.put("/:id", updateAdmissionCourseApplicationHandler);
router.delete("/:id", deleteAdmissionCourseApplicationHandler);

export default router; 