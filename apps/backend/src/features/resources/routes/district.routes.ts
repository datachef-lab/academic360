import express from "express";

import {
  createDistrict,
  deleteDistrictRecord,
  getAllDistrict,
  getDistrictById,
  updateDistrictRecord,
} from "@/features/resources/controllers/district.controller.js";

const router = express.Router();

router.post("/", createDistrict);
router.get("/", getAllDistrict);
router.get("/:id", getDistrictById);
router.put("/:id", updateDistrictRecord);
router.delete("/:id", deleteDistrictRecord);

export default router;
