import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createAccessGroupDesignationSchema } from "@repo/db/schemas/models/administration";
import {
  createAccessGroupDesignation,
  deleteAccessGroupDesignation,
  getAllAccessGroupDesignations,
  getAccessGroupDesignationById,
  updateAccessGroupDesignation,
} from "../controllers/access-group-designation.controller.js";

const router = Router();

const createAccessGroupDesignationPayloadSchema =
  createAccessGroupDesignationSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

const updateAccessGroupDesignationPayloadSchema =
  createAccessGroupDesignationPayloadSchema.partial();

router.post(
  "/",
  validateData(createAccessGroupDesignationPayloadSchema),
  createAccessGroupDesignation as RequestHandler,
);

router.get("/", getAllAccessGroupDesignations as RequestHandler);

router.get("/:id", getAccessGroupDesignationById as RequestHandler);

router.put(
  "/:id",
  validateData(updateAccessGroupDesignationPayloadSchema),
  updateAccessGroupDesignation as RequestHandler,
);

router.delete("/:id", deleteAccessGroupDesignation as RequestHandler);

export default router;
