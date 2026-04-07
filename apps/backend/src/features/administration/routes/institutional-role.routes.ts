import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createUserInstitutionalRoleModelSchema } from "@repo/db/schemas/models/administration";
import {
  createInstitutionalRole,
  deleteInstitutionalRole,
  getAllInstitutionalRoles,
  getInstitutionalRoleById,
  updateInstitutionalRole,
} from "../controllers/institutional-role.controller.js";

const router = Router();

const createInstitutionalRolePayloadSchema =
  createUserInstitutionalRoleModelSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

const updateInstitutionalRolePayloadSchema =
  createInstitutionalRolePayloadSchema.partial();

router.post(
  "/",
  validateData(createInstitutionalRolePayloadSchema),
  createInstitutionalRole as RequestHandler,
);

router.get("/", getAllInstitutionalRoles as RequestHandler);

router.get("/:id", getInstitutionalRoleById as RequestHandler);

router.put(
  "/:id",
  validateData(updateInstitutionalRolePayloadSchema),
  updateInstitutionalRole as RequestHandler,
);

router.delete("/:id", deleteInstitutionalRole as RequestHandler);

export default router;
