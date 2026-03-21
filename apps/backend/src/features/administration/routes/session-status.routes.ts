import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createSessionStatusSchema } from "@repo/db/schemas/models/administration";
import {
  createSessionStatus,
  deleteSessionStatus,
  getAllSessionStatuses,
  getSessionStatusById,
  updateSessionStatus,
} from "../controllers/session-status.controller.js";

const router = Router();

const createSessionStatusPayloadSchema = createSessionStatusSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const updateSessionStatusPayloadSchema =
  createSessionStatusPayloadSchema.partial();

router.post(
  "/",
  validateData(createSessionStatusPayloadSchema),
  createSessionStatus as RequestHandler,
);

router.get("/", getAllSessionStatuses as RequestHandler);

router.get("/:id", getSessionStatusById as RequestHandler);

router.put(
  "/:id",
  validateData(updateSessionStatusPayloadSchema),
  updateSessionStatus as RequestHandler,
);

router.delete("/:id", deleteSessionStatus as RequestHandler);

export default router;
