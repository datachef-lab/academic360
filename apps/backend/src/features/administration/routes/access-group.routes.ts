import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import {
  createAccessGroupSchema,
  createAccessGroupApplicationSchema,
  createAccessGroupDesignationSchema,
  createAccessGroupUserTypeSchema,
  createAccessGroupModuleSchema,
  createAccessGroupModulePermissionSchema,
  createAccessGroupModuleProgramCourseSchema,
  createAccessGroupModuleProgramCourseClassSchema,
} from "@repo/db/schemas/models/administration";
import {
  createAccessGroup,
  deleteAccessGroup,
  getAllAccessGroups,
  getAccessGroupById,
  updateAccessGroup,
} from "../controllers/access-group.controller.js";

const accessGroupApplicationInputSchema =
  createAccessGroupApplicationSchema.omit({
    id: true,
    accessGroupId: true,
    createdAt: true,
    updatedAt: true,
  });

const accessGroupDesignationInputSchema =
  createAccessGroupDesignationSchema.omit({
    id: true,
    accessGroupId: true,
    createdAt: true,
    updatedAt: true,
  });

const accessGroupUserTypeInputSchema = createAccessGroupUserTypeSchema.omit({
  id: true,
  accessGroupId: true,
  createdAt: true,
  updatedAt: true,
});

const accessGroupModulePermissionInputSchema =
  createAccessGroupModulePermissionSchema.omit({
    id: true,
    accessGroupModuleId: true,
    createdAt: true,
    updatedAt: true,
  });

const accessGroupModuleProgramCourseClassInputSchema =
  createAccessGroupModuleProgramCourseClassSchema
    .omit({
      id: true,
      accessGroupModuleProgramCourseId: true,
      createdAt: true,
      updatedAt: true,
    })
    .partial({ isAllowed: true });

const accessGroupModuleProgramCourseInputSchema =
  createAccessGroupModuleProgramCourseSchema
    .omit({
      id: true,
      accessGroupModuleId: true,
      createdAt: true,
      updatedAt: true,
    })
    .partial({ isAllowed: true })
    .extend({
      classes: accessGroupModuleProgramCourseClassInputSchema
        .array()
        .optional(),
    });

const accessGroupModuleInputSchema = createAccessGroupModuleSchema
  .omit({
    id: true,
    accessGroupId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    permissions: accessGroupModulePermissionInputSchema.array().optional(),
    programCourses: accessGroupModuleProgramCourseInputSchema
      .array()
      .optional(),
  })
  .partial({ type: true, isAllowed: true });

const createAccessGroupPayloadSchema = createAccessGroupSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    applications: accessGroupApplicationInputSchema.array().optional(),
    designations: accessGroupDesignationInputSchema.array().optional(),
    userTypes: accessGroupUserTypeInputSchema.array().optional(),
    features: accessGroupModuleInputSchema.array().optional(),
  });

const updateAccessGroupPayloadSchema = createAccessGroupPayloadSchema.partial();

const router = Router();

router.post(
  "/",
  validateData(createAccessGroupPayloadSchema),
  createAccessGroup as RequestHandler,
);

router.get("/", getAllAccessGroups as RequestHandler);

router.get("/:id", getAccessGroupById as RequestHandler);

router.put(
  "/:id",
  validateData(updateAccessGroupPayloadSchema),
  updateAccessGroup as RequestHandler,
);

router.delete("/:id", deleteAccessGroup as RequestHandler);

export default router;
