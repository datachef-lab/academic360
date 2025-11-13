import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  createDesignationHandler,
  deleteDesignationHandler,
  getDesignationByIdHandler,
  getDesignationsHandler,
  updateDesignationHandler,
} from "@/features/administration/controllers/designation.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createDesignationHandler);
router.get("/", getDesignationsHandler);
router.get("/:id", getDesignationByIdHandler);
router.put("/:id", updateDesignationHandler);
router.delete("/:id", deleteDesignationHandler);

export default router;
