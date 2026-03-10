import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserPrivilegeSubHandler,
  deleteUserPrivilegeSubHandler,
  getUserPrivilegeSubByIdHandler,
  getUserPrivilegeSubsHandler,
  updateUserPrivilegeSubHandler,
} from "@/features/administration/controllers/user-privilege-sub.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createUserPrivilegeSubHandler);
router.get("/", getUserPrivilegeSubsHandler);
router.get("/:id", getUserPrivilegeSubByIdHandler);
router.put("/:id", updateUserPrivilegeSubHandler);
router.delete("/:id", deleteUserPrivilegeSubHandler);

export default router;
