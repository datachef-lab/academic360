import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createSubDepartmentHandler,
  deleteSubDepartmentHandler,
  getSubDepartmentByIdHandler,
  getSubDepartmentsHandler,
  updateSubDepartmentHandler,
} from "@/features/administration/controllers/sub-department.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createSubDepartmentHandler);
router.get("/", getSubDepartmentsHandler);
router.get("/:id", getSubDepartmentByIdHandler);
router.put("/:id", updateSubDepartmentHandler);
router.delete("/:id", deleteSubDepartmentHandler);

export default router;
