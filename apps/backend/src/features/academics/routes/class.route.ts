import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {
  createClassController,
  getAllClassesController,
  getClassByIdController,
  updateClassController,
  deleteClassController,
} from "../controllers/class.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createClassController);
router.get("/", getAllClassesController);
router.get("/:id", getClassByIdController);
router.put("/:id", updateClassController);
router.delete("/:id", deleteClassController);

export default router;
