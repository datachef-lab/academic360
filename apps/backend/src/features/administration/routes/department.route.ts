import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createDepartmentHandler,
  deleteDepartmentHandler,
  getDepartmentByIdHandler,
  getDepartmentsHandler,
  updateDepartmentHandler,
} from "@/features/administration/controllers/department.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createDepartmentHandler);
router.get("/", getDepartmentsHandler);
router.get("/:id", getDepartmentByIdHandler);
router.put("/:id", updateDepartmentHandler);
router.delete("/:id", deleteDepartmentHandler);

export default router;
