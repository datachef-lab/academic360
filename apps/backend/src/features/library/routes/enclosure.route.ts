import express from "express";
import {
  createEnclosureController,
  deleteEnclosureController,
  getAllEnclosuresController,
  getEnclosureByIdController,
  updateEnclosureController,
} from "@/features/library/controllers/enclosure.controller.js";

const router = express.Router();

router.post("/", createEnclosureController);
router.get("/", getAllEnclosuresController);
router.get("/:id", getEnclosureByIdController);
router.put("/:id", updateEnclosureController);
router.delete("/:id", deleteEnclosureController);

export default router;
