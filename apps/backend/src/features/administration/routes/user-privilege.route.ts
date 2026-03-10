import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserPrivilegeHandler,
  deleteUserPrivilegeHandler,
  getUserPrivilegeByIdHandler,
  getUserPrivilegesHandler,
  updateUserPrivilegeHandler,
} from "@/features/administration/controllers/user-privilege.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createUserPrivilegeHandler);
router.get("/", getUserPrivilegesHandler);
router.get("/:id", getUserPrivilegeByIdHandler);
router.put("/:id", updateUserPrivilegeHandler);
router.delete("/:id", deleteUserPrivilegeHandler);

export default router;
