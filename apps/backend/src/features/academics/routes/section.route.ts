import express from "express";

import {
  createSectionController,
  deleteSectionController,
  getAllSectionsController,
  updateSectionController,
} from "../controllers/section.controller.js";

const router = express.Router();
router.get("/", getAllSectionsController);
router.post("/", createSectionController);
router.put("/:id", updateSectionController);
router.delete("/:id", deleteSectionController);

export default router;
