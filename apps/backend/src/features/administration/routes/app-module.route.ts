import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createAppModuleHandler,
  deleteAppModuleHandler,
  getAppModuleByIdHandler,
  getAppModulesHandler,
  updateAppModuleHandler,
} from "@/features/administration/controllers/app-module.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createAppModuleHandler);
router.get("/", getAppModulesHandler);
router.get("/:id", getAppModuleByIdHandler);
router.put("/:id", updateAppModuleHandler);
router.delete("/:id", deleteAppModuleHandler);

export default router;
