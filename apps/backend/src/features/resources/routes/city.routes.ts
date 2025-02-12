import express from "express";

import {
  createNewCity,
  deleteCity,
  getAllCity,
  getCitiesById,
  updateCity,
} from "@/features/resources/controllers/city.controller.js";

const router = express.Router();

// Create a new city Route
router.post("/", createNewCity);

// Get all city Route
router.get("/", getAllCity);

// Get by cities ID Route
router.get("/:id", getCitiesById);

// Update the city Route
router.put("/:id", updateCity);

//Delete the category Route
router.delete("/:id", deleteCity);

export default router;
