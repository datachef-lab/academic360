import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserStatusHandler,
  deleteUserStatusHandler,
  getUserStatusByIdHandler,
  getUserStatusesHandler,
  updateUserStatusHandler,
} from "@/features/administration/controllers/user-status.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createUserStatusHandler);
router.get("/", getUserStatusesHandler);
router.get("/:id", getUserStatusByIdHandler);
router.put("/:id", updateUserStatusHandler);
router.delete("/:id", deleteUserStatusHandler);

export default router;
