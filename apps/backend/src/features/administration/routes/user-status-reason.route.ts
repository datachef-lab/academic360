import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserStatusReasonHandler,
  deleteUserStatusReasonHandler,
  getUserStatusReasonByIdHandler,
  getUserStatusReasonsHandler,
  updateUserStatusReasonHandler,
} from "@/features/administration/controllers/user-status-reason.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createUserStatusReasonHandler);
router.get("/", getUserStatusReasonsHandler);
router.get("/:id", getUserStatusReasonByIdHandler);
router.put("/:id", updateUserStatusReasonHandler);
router.delete("/:id", deleteUserStatusReasonHandler);

export default router;
