import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createAccessGroupModulePermissionSchema } from "@repo/db/schemas/models/administration";
import {
  createAccessGroupModulePermission,
  deleteAccessGroupModulePermission,
  getAllAccessGroupModulePermissions,
  getAccessGroupModulePermissionById,
  updateAccessGroupModulePermission,
} from "../controllers/access-group-module-permission.controller.js";

const router = Router();

const createAccessGroupModulePermissionPayloadSchema =
  createAccessGroupModulePermissionSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

const updateAccessGroupModulePermissionPayloadSchema =
  createAccessGroupModulePermissionPayloadSchema.partial();

router.post(
  "/",
  validateData(createAccessGroupModulePermissionPayloadSchema),
  createAccessGroupModulePermission as RequestHandler,
);

router.get("/", getAllAccessGroupModulePermissions as RequestHandler);

router.get("/:id", getAccessGroupModulePermissionById as RequestHandler);

router.put(
  "/:id",
  validateData(updateAccessGroupModulePermissionPayloadSchema),
  updateAccessGroupModulePermission as RequestHandler,
);

router.delete("/:id", deleteAccessGroupModulePermission as RequestHandler);

export default router;
