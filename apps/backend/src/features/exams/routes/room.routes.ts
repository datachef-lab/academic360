import { Router, RequestHandler } from "express";
import {
  createRoom,
  deleteRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
} from "../controllers/room.controller.js";

const router = Router();

router.post("/", createRoom as RequestHandler);
router.get("/", getAllRooms as RequestHandler);
router.get("/:id", getRoomById as RequestHandler);
router.put("/:id", updateRoom as RequestHandler);
router.delete("/:id", deleteRoom as RequestHandler);

export default router;
