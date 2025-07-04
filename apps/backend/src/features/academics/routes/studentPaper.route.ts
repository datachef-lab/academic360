import express from "express";

import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  getStudentPapers,
  createStudentPaperController,
  getAllStudentPapersController,
  getStudentPaperByIdController,
  updateStudentPaperController,
  deleteStudentPaperController
} from "../controllers/studentPaper.controller.js";

const router = express.Router();

// router.use(verifyJWT);

router.get("/papers", getStudentPapers);

// CRUD routes
router.post("/", createStudentPaperController);
router.get("/", getAllStudentPapersController);
router.get("/:id", getStudentPaperByIdController);
router.put("/:id", updateStudentPaperController);
router.delete("/:id", deleteStudentPaperController);

export default router;

