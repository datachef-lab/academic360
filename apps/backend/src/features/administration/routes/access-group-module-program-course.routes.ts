import { Router, RequestHandler } from "express";
import { validateData } from "@/middlewares/index.js";
import { createAccessGroupModuleProgramCourseSchema } from "@repo/db/schemas/models/administration";
import {
  createAccessGroupModuleProgramCourse,
  deleteAccessGroupModuleProgramCourse,
  getAllAccessGroupModuleProgramCourses,
  getAccessGroupModuleProgramCourseById,
  updateAccessGroupModuleProgramCourse,
} from "../controllers/access-group-module-program-course.controller.js";

const router = Router();

const createAccessGroupModuleProgramCoursePayloadSchema =
  createAccessGroupModuleProgramCourseSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

const updateAccessGroupModuleProgramCoursePayloadSchema =
  createAccessGroupModuleProgramCoursePayloadSchema.partial();

router.post(
  "/",
  validateData(createAccessGroupModuleProgramCoursePayloadSchema),
  createAccessGroupModuleProgramCourse as RequestHandler,
);

router.get("/", getAllAccessGroupModuleProgramCourses as RequestHandler);

router.get("/:id", getAccessGroupModuleProgramCourseById as RequestHandler);

router.put(
  "/:id",
  validateData(updateAccessGroupModuleProgramCoursePayloadSchema),
  updateAccessGroupModuleProgramCourse as RequestHandler,
);

router.delete("/:id", deleteAccessGroupModuleProgramCourse as RequestHandler);

export default router;
