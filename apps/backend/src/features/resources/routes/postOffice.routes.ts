import express from "express";

import {
  createPostOffice,
  deletePostOfficeRecord,
  getAllPostOffice,
  getPostOfficeById,
  updatePostOfficeRecord,
} from "@/features/resources/controllers/postOffice.controller.js";

const router = express.Router();

router.post("/", createPostOffice);
router.get("/", getAllPostOffice);
router.get("/:id", getPostOfficeById);
router.put("/:id", updatePostOfficeRecord);
router.delete("/:id", deletePostOfficeRecord);

export default router;
