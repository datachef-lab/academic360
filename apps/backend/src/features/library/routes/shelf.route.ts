import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createShelfController,
  deleteShelfController,
  getShelfByIdController,
  getShelfListController,
  updateShelfController,
} from "@/features/library/controllers/shelf.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getShelfListController);
router.get("/:id", getShelfByIdController);
router.post("/", createShelfController);
router.put("/:id", updateShelfController);
router.delete("/:id", deleteShelfController);

export default router;
