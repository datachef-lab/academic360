import express from "express";

import {
  createPoliceStation,
  deletePoliceStationRecord,
  getAllPoliceStation,
  getPoliceStationById,
  updatePoliceStationRecord,
} from "@/features/resources/controllers/policeStation.controller.js";

const router = express.Router();

router.post("/", createPoliceStation);
router.get("/", getAllPoliceStation);
router.get("/:id", getPoliceStationById);
router.put("/:id", updatePoliceStationRecord);
router.delete("/:id", deletePoliceStationRecord);

export default router;
