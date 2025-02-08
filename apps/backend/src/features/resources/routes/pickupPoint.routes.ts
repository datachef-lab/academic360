
import express from "express";
import { createPickupPoint, deletePickupPoint, getAllPickupPoint, updatePickupPoint } from "../controllers/pickupPoint.controller.js";



const router = express.Router();


router.post("/", createPickupPoint);
router.get("/", getAllPickupPoint);
router.put("/", updatePickupPoint);
router.delete("/", deletePickupPoint);

export default router;
