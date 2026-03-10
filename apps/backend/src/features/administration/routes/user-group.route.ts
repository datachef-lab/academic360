import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserGroupHandler,
  deleteUserGroupHandler,
  getUserGroupByIdHandler,
  getUserGroupsHandler,
  updateUserGroupHandler,
} from "@/features/administration/controllers/user-group.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createUserGroupHandler);
router.get("/", getUserGroupsHandler);
router.get("/:id", getUserGroupByIdHandler);
router.put("/:id", updateUserGroupHandler);
router.delete("/:id", deleteUserGroupHandler);

export default router;
