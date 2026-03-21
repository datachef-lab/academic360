import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createUserStatusMasterSchema } from "@repo/db/schemas/models/administration";
import {
  createUserStatusMaster,
  deleteUserStatusMaster,
  getAllUserStatusMasters,
  getUserStatusMasterById,
  updateUserStatusMaster,
} from "../controllers/user-status-master.controller.js";

const router = Router();
const createUserStatusMasterPayloadSchema = createUserStatusMasterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
const updateUserStatusMasterPayloadSchema =
  createUserStatusMasterPayloadSchema.partial();

router.post(
  "/",
  validateData(createUserStatusMasterPayloadSchema),
  createUserStatusMaster as RequestHandler,
);
router.get("/", getAllUserStatusMasters as RequestHandler);
router.get("/:id", getUserStatusMasterById as RequestHandler);
router.put(
  "/:id",
  validateData(updateUserStatusMasterPayloadSchema),
  updateUserStatusMaster as RequestHandler,
);
router.delete("/:id", deleteUserStatusMaster as RequestHandler);

export default router;
