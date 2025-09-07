import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAdmissionGeneralInfoHandler,
  getAdmissionGeneralInfoByIdHandler,
  getAdmissionGeneralInfoByApplicationFormIdHandler,
  updateAdmissionGeneralInfoHandler,
  deleteAdmissionGeneralInfoHandler,
} from "../controllers/admission-general-info.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAdmissionGeneralInfoHandler);
router.get("/:id", getAdmissionGeneralInfoByIdHandler);
router.get(
  "/application-form/:applicationFormId",
  getAdmissionGeneralInfoByApplicationFormIdHandler,
);
router.put("/:id", updateAdmissionGeneralInfoHandler);
router.delete("/:id", deleteAdmissionGeneralInfoHandler);

export default router;
