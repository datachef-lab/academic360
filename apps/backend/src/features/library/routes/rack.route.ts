import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createRackController,
  deleteRackController,
  getRackByIdController,
  getRackListController,
  updateRackController,
} from "@/features/library/controllers/rack.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getRackListController);
router.get("/:id", getRackByIdController);
router.post("/", createRackController);
router.put("/:id", updateRackController);
router.delete("/:id", deleteRackController);

export default router;
