import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAdmissionAcademicInfoHandler,
  getAdmissionAcademicInfoByIdHandler,
  getAdmissionAcademicInfoByApplicationFormIdHandler,
  updateAdmissionAcademicInfoHandler,
  deleteAdmissionAcademicInfoHandler
} from "../controllers/admission-academic-info.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAdmissionAcademicInfoHandler);
router.get("/:id", getAdmissionAcademicInfoByIdHandler);
router.get("/application-form/:applicationFormId", getAdmissionAcademicInfoByApplicationFormIdHandler);
router.put("/:id", updateAdmissionAcademicInfoHandler);
router.delete("/:id", deleteAdmissionAcademicInfoHandler);

export default router; 