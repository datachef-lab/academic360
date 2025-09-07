import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createApplicationFormHandler,
  getApplicationFormByIdHandler,
  getApplicationFormsByAdmissionIdHandler,
  updateApplicationFormHandler,
  deleteApplicationFormHandler,
} from "../controllers/application-form.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createApplicationFormHandler);
router.get("/:id", getApplicationFormByIdHandler);
router.get("/admission/:admissionId", getApplicationFormsByAdmissionIdHandler);
router.put("/:id", updateApplicationFormHandler);
router.delete("/:id", deleteApplicationFormHandler);

export default router;
