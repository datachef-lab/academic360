import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserStatusSessionMappingHandler,
  deleteUserStatusSessionMappingHandler,
  getUserStatusSessionMappingByIdHandler,
  getUserStatusSessionMappingsHandler,
  updateUserStatusSessionMappingHandler,
} from "@/features/administration/controllers/user-status-session-mapping.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createUserStatusSessionMappingHandler);
router.get("/", getUserStatusSessionMappingsHandler);
router.get("/:id", getUserStatusSessionMappingByIdHandler);
router.put("/:id", updateUserStatusSessionMappingHandler);
router.delete("/:id", deleteUserStatusSessionMappingHandler);

export default router;
