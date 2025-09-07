import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createAcademicSubjectHandler,
  getAcademicSubjectByIdHandler,
  getAllAcademicSubjectsHandler,
  updateAcademicSubjectHandler,
  deleteAcademicSubjectHandler,
} from "../controllers/academic-subject.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAcademicSubjectHandler);
router.get("/:id", getAcademicSubjectByIdHandler);
router.get("/", getAllAcademicSubjectsHandler);
router.put("/:id", updateAcademicSubjectHandler);
router.delete("/:id", deleteAcademicSubjectHandler);

export default router;
