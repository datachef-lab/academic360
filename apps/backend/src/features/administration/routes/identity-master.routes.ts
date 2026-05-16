import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createIdentityMasterSchema } from "@repo/db/schemas/models/administration";
import {
  createIdentityMaster,
  deleteIdentityMaster,
  getAllIdentityMasters,
  getIdentityMasterById,
  updateIdentityMaster,
} from "../controllers/identity-master.controller.js";

const router = Router();

const createIdentityMasterPayloadSchema = createIdentityMasterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const updateIdentityMasterPayloadSchema =
  createIdentityMasterPayloadSchema.partial();

router.post(
  "/",
  validateData(createIdentityMasterPayloadSchema),
  createIdentityMaster as RequestHandler,
);

router.get("/", getAllIdentityMasters as RequestHandler);

router.get("/:id", getIdentityMasterById as RequestHandler);

router.put(
  "/:id",
  validateData(updateIdentityMasterPayloadSchema),
  updateIdentityMaster as RequestHandler,
);

router.delete("/:id", deleteIdentityMaster as RequestHandler);

export default router;
