import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createAccessGroupUserTypeSchema } from "@repo/db/schemas/models/administration";
import {
  createAccessGroupUserType,
  deleteAccessGroupUserType,
  getAllAccessGroupUserTypes,
  getAccessGroupUserTypeById,
  updateAccessGroupUserType,
} from "../controllers/access-group-user-type.controller.js";

const router = Router();

const createAccessGroupUserTypePayloadSchema =
  createAccessGroupUserTypeSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

const updateAccessGroupUserTypePayloadSchema =
  createAccessGroupUserTypePayloadSchema.partial();

router.post(
  "/",
  validateData(createAccessGroupUserTypePayloadSchema),
  createAccessGroupUserType as RequestHandler,
);

router.get("/", getAllAccessGroupUserTypes as RequestHandler);

router.get("/:id", getAccessGroupUserTypeById as RequestHandler);

router.put(
  "/:id",
  validateData(updateAccessGroupUserTypePayloadSchema),
  updateAccessGroupUserType as RequestHandler,
);

router.delete("/:id", deleteAccessGroupUserType as RequestHandler);

export default router;
