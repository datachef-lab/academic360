import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAdmissionAdditionalInfoHandler,
  getAdmissionAdditionalInfoByIdHandler,
  getAdmissionAdditionalInfoByApplicationFormIdHandler,
  updateAdmissionAdditionalInfoHandler,
  deleteAdmissionAdditionalInfoHandler
} from "../controllers/admission-additional-info.controller";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAdmissionAdditionalInfoHandler);
router.get("/:id", getAdmissionAdditionalInfoByIdHandler);
router.get("/application-form/:applicationFormId", getAdmissionAdditionalInfoByApplicationFormIdHandler);
router.put("/:id", updateAdmissionAdditionalInfoHandler);
router.delete("/:id", deleteAdmissionAdditionalInfoHandler);

export default router; 