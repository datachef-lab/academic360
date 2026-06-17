import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createArchiveController,
  deleteArchiveController,
  getArchive,
  listArchives,
  updateArchiveController,
} from "@/features/library/controllers/academic-archive.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", listArchives);
router.get("/:id", getArchive);
router.post("/", createArchiveController);
router.put("/:id", updateArchiveController);
router.delete("/:id", deleteArchiveController);
export default router;
