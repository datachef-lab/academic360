import { Router, RequestHandler } from "express";
import {
  createFloor,
  deleteFloor,
  getAllFloors,
  getFloorById,
  updateFloor,
} from "../controllers/floor.controller.js";

const router = Router();

router.post("/", createFloor as RequestHandler);
router.get("/", getAllFloors as RequestHandler);
router.get("/:id", getFloorById as RequestHandler);
router.put("/:id", updateFloor as RequestHandler);
router.delete("/:id", deleteFloor as RequestHandler);

export default router;
