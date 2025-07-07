import express from "express";

import {
  createNewCity,
  deleteCity,
  getAllCity,
  getCitiesById,
  updateCity,
} from "@/features/resources/controllers/city.controller.js";

const router = express.Router();

// Create a new city
router.post("/", createNewCity);

// Get all cities
router.get("/", getAllCity);

// Get a specific city by ID
router.get("/:id", getCitiesById);

// Update a city
router.put("/:id", updateCity);

// Delete a city
router.delete("/:id", deleteCity);

export default router;
