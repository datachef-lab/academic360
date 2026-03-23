import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createAppModuleSchema } from "@repo/db/schemas/models/administration";
import {
  createAppModule,
  deleteAppModule,
  getAllAppModules,
  getAppModuleById,
  updateAppModule,
} from "../controllers/app-module.controller.js";

const router = Router();

const createAppModulePayloadSchema = createAppModuleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const updateAppModulePayloadSchema = createAppModulePayloadSchema.partial();

router.post(
  "/",
  validateData(createAppModulePayloadSchema),
  createAppModule as RequestHandler,
);

router.get("/", getAllAppModules as RequestHandler);

router.get("/:id", getAppModuleById as RequestHandler);

router.put(
  "/:id",
  validateData(updateAppModulePayloadSchema),
  updateAppModule as RequestHandler,
);

router.delete("/:id", deleteAppModule as RequestHandler);

export default router;
