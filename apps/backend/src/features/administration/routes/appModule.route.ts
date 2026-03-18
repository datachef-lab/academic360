import express from "express";
import {
  createAppModule,
  getAllAppModules,
  getAppModuleById,
  updateAppModule,
  deleteAppModule,
} from "@/features/administration/controllers/app-module.controller.js";

const router = express.Router();

router.post("/", createAppModule);
router.get("/", getAllAppModules);
router.get("/:id", getAppModuleById);
router.put("/:id", updateAppModule);
router.delete("/:id", deleteAppModule);

export default router;
