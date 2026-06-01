import express from "express";
// import { verifyJWT } from "@/middlewares/index.js";
import {
  createVendorController,
  deleteVendorController,
  getAllVendorsController,
  getVendorByIdController,
  updateVendorController,
} from "@/features/library/controllers/vendor.controller.js";

const router = express.Router();

// router.use(verifyJWT);

router.post("/", createVendorController);
router.get("/query", getAllVendorsController);
router.get("/:id", getVendorByIdController);
router.put("/:id", updateVendorController);
router.delete("/:id", deleteVendorController);

export default router;
