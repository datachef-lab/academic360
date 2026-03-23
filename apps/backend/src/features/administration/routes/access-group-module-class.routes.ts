import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createAccessGroupModuleClassSchema } from "@repo/db/schemas/models/administration";
import {
  createAccessGroupModuleClass,
  deleteAccessGroupModuleClass,
  getAllAccessGroupModuleClasses,
  getAccessGroupModuleClassById,
  updateAccessGroupModuleClass,
} from "../controllers/access-group-module-class.controller.js";

const router = Router();

const createAccessGroupModuleClassPayloadSchema =
  createAccessGroupModuleClassSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

const updateAccessGroupModuleClassPayloadSchema =
  createAccessGroupModuleClassPayloadSchema.partial();

router.post(
  "/",
  validateData(createAccessGroupModuleClassPayloadSchema),
  createAccessGroupModuleClass as RequestHandler,
);

router.get("/", getAllAccessGroupModuleClasses as RequestHandler);

router.get("/:id", getAccessGroupModuleClassById as RequestHandler);

router.put(
  "/:id",
  validateData(updateAccessGroupModuleClassPayloadSchema),
  updateAccessGroupModuleClass as RequestHandler,
);

router.delete("/:id", deleteAccessGroupModuleClass as RequestHandler);

export default router;
