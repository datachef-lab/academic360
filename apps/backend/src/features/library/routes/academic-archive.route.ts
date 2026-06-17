import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createArchiveController,
  deleteArchiveController,
  getArchive,
  getArchivePresignedUrl,
  listArchives,
  updateArchiveController,
  uploadArchiveFileMiddleware,
} from "@/features/library/controllers/academic-archive.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", listArchives);
router.get("/:id/url", getArchivePresignedUrl);
router.get("/:id", getArchive);
router.post("/", uploadArchiveFileMiddleware, createArchiveController);
router.put("/:id", uploadArchiveFileMiddleware, updateArchiveController);
router.delete("/:id", deleteArchiveController);
export default router;
