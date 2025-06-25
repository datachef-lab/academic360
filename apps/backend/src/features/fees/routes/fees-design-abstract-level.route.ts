import { Router } from "express";
import { getFeesDesignAbstractLevelHandler } from "../controllers/fees-design-abstract-level.controller.js";

const router = Router();

router.get("/design/abstract", getFeesDesignAbstractLevelHandler);

export default router; 