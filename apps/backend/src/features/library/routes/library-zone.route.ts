import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createZoneController,
  deleteZoneController,
  getZone,
  getZoneOccupancyController,
  listGateEventsController,
  listZones,
  listZonesOccupancyController,
  recordGateEventController,
  updateZoneController,
} from "@/features/library/controllers/library-zone.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/", listZones);
router.get("/gate-events", listGateEventsController);
router.post("/gate-events", recordGateEventController);
router.get("/occupancy", listZonesOccupancyController);
router.get("/:id/occupancy", getZoneOccupancyController);
router.get("/:id", getZone);
router.post("/", createZoneController);
router.put("/:id", updateZoneController);
router.delete("/:id", deleteZoneController);
export default router;
