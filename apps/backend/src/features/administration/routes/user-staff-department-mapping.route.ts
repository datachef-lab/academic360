import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createUserStaffDepartmentMappingHandler,
  deleteUserStaffDepartmentMappingHandler,
  getUserStaffDepartmentMappingByIdHandler,
  getUserStaffDepartmentMappingsHandler,
} from "@/features/administration/controllers/user-staff-department-mapping.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createUserStaffDepartmentMappingHandler);
router.get("/", getUserStaffDepartmentMappingsHandler);
router.get("/:id", getUserStaffDepartmentMappingByIdHandler);
router.delete("/:id", deleteUserStaffDepartmentMappingHandler);

export default router;
