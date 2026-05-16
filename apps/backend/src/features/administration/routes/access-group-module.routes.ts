import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createAccessGroupModuleSchema } from "@repo/db/schemas/models/administration";
import {
  createAccessGroupModule,
  deleteAccessGroupModule,
  getAllAccessGroupModules,
  getAccessGroupModuleById,
  updateAccessGroupModule,
} from "../controllers/access-group-module.controller.js";

const router = Router();

const createAccessGroupModulePayloadSchema = createAccessGroupModuleSchema.omit(
  {
    id: true,
    createdAt: true,
    updatedAt: true,
  },
);

const updateAccessGroupModulePayloadSchema =
  createAccessGroupModulePayloadSchema.partial();

router.post(
  "/",
  validateData(createAccessGroupModulePayloadSchema),
  createAccessGroupModule as RequestHandler,
);

router.get("/", getAllAccessGroupModules as RequestHandler);

router.get("/:id", getAccessGroupModuleById as RequestHandler);

router.put(
  "/:id",
  validateData(updateAccessGroupModulePayloadSchema),
  updateAccessGroupModule as RequestHandler,
);

router.delete("/:id", deleteAccessGroupModule as RequestHandler);

export default router;
