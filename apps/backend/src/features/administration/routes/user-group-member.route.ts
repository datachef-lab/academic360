import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserGroupMemberHandler,
  deleteUserGroupMemberHandler,
  getUserGroupMemberByIdHandler,
  getUserGroupMembersHandler,
} from "@/features/administration/controllers/user-group-member.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createUserGroupMemberHandler);
router.get("/", getUserGroupMembersHandler);
router.get("/:id", getUserGroupMemberByIdHandler);
router.delete("/:id", deleteUserGroupMemberHandler);

export default router;
