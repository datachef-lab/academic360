import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createDesignationSchema } from "@repo/db/schemas/models/administration";
import {
  createDesignation,
  deleteDesignation,
  getAllDesignations,
  getDesignationById,
  updateDesignation,
} from "../controllers/designation.controller.js";

const router = Router();

const createDesignationPayloadSchema = createDesignationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const updateDesignationPayloadSchema = createDesignationPayloadSchema.partial();

router.post(
  "/",
  validateData(createDesignationPayloadSchema),
  createDesignation as RequestHandler,
);

router.get("/", getAllDesignations as RequestHandler);

router.get("/:id", getDesignationById as RequestHandler);

router.put(
  "/:id",
  validateData(updateDesignationPayloadSchema),
  updateDesignation as RequestHandler,
);

router.delete("/:id", deleteDesignation as RequestHandler);

export default router;
