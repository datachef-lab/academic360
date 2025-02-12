import express from "express";
import {
    createNewTransport,
    deleteTransport,
    getAllTransport,
    getTransportById,
    updateTransport,
} from "@/features/resources/controllers/transport.controller.js";

const router = express.Router();

// Create a new Transport Route
router.post("/", createNewTransport);

// Get all Transport Route
router.get("/", getAllTransport);

// Get by Transport ID
router.get("/:id", getTransportById);

// Update the Transport Route
router.put("/:id", updateTransport);

//Delete the Transport Route
router.delete("/:id", deleteTransport);

export default router;
