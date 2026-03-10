import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserGroupDomainHandler,
  deleteUserGroupDomainHandler,
  getUserGroupDomainByIdHandler,
  getUserGroupDomainsHandler,
} from "@/features/administration/controllers/user-group-domain.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createUserGroupDomainHandler);
router.get("/", getUserGroupDomainsHandler);
router.get("/:id", getUserGroupDomainByIdHandler);
router.delete("/:id", deleteUserGroupDomainHandler);

export default router;
