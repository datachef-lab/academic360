import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createVendorController,
  deleteVendorController,
  getVendorByIdController,
  getVendorListController,
  updateVendorController,
} from "@/features/library/controllers/vendor.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getVendorListController);
router.get("/:id", getVendorByIdController);
router.post("/", createVendorController);
router.put("/:id", updateVendorController);
router.delete("/:id", deleteVendorController);

export default router;
