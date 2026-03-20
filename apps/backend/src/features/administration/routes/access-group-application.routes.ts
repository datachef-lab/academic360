import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createAccessGroupApplicationSchema } from "@repo/db/schemas/models/administration";
import {
  createAccessGroupApplication,
  deleteAccessGroupApplication,
  getAllAccessGroupApplications,
  getAccessGroupApplicationById,
  updateAccessGroupApplication,
} from "../controllers/access-group-application.controller.js";

const router = Router();

const createAccessGroupApplicationPayloadSchema =
  createAccessGroupApplicationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

const updateAccessGroupApplicationPayloadSchema =
  createAccessGroupApplicationPayloadSchema.partial();

router.post(
  "/",
  validateData(createAccessGroupApplicationPayloadSchema),
  createAccessGroupApplication as RequestHandler,
);
router.get("/", getAllAccessGroupApplications as RequestHandler);
router.get("/:id", getAccessGroupApplicationById as RequestHandler);
router.put(
  "/:id",
  validateData(updateAccessGroupApplicationPayloadSchema),
  updateAccessGroupApplication as RequestHandler,
);
router.delete("/:id", deleteAccessGroupApplication as RequestHandler);

export default router;
