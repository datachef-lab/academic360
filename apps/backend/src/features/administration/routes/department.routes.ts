import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createDepartmentSchema } from "@repo/db/schemas/models/administration";
import {
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
} from "../controllers/department.controller.js";

const router = Router();

const createDepartmentPayloadSchema = createDepartmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const updateDepartmentPayloadSchema = createDepartmentPayloadSchema.partial();

router.post(
  "/",
  validateData(createDepartmentPayloadSchema),
  createDepartment as RequestHandler,
);

router.get("/", getAllDepartments as RequestHandler);

router.get("/:id", getDepartmentById as RequestHandler);

router.put(
  "/:id",
  validateData(updateDepartmentPayloadSchema),
  updateDepartment as RequestHandler,
);

router.delete("/:id", deleteDepartment as RequestHandler);

export default router;
