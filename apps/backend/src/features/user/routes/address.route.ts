import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createAddress,
  getAddressById,
  getAllAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

const router = express.Router();

// router.use(verifyJWT);

// Create
router.post("/", createAddress);
// Get all
router.get("/", getAllAddress);
// Get by id
router.get("/:id", getAddressById);
// Update
router.put("/:id", updateAddress);
// Delete
router.delete("/:id", deleteAddress);

export default router;
