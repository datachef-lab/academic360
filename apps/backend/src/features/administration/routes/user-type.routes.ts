import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createUserTypeSchema } from "@repo/db/schemas/models/administration";
import {
  createUserType,
  deleteUserType,
  getAllUserTypes,
  getUserTypeById,
  updateUserType,
} from "../controllers/user-type.controller.js";

const router = Router();
const createUserTypePayloadSchema = createUserTypeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
const updateUserTypePayloadSchema = createUserTypePayloadSchema.partial();

router.post(
  "/",
  validateData(createUserTypePayloadSchema),
  createUserType as RequestHandler,
);
router.get("/", getAllUserTypes as RequestHandler);
router.get("/:id", getUserTypeById as RequestHandler);
router.put(
  "/:id",
  validateData(updateUserTypePayloadSchema),
  updateUserType as RequestHandler,
);
router.delete("/:id", deleteUserType as RequestHandler);

export default router;
