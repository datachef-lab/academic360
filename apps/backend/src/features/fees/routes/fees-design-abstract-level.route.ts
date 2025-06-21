import { Router } from "express";
import { getFeesDesignAbstractLevelHandler } from "../controllers/fees-design-abstract-level.controller";

const router = Router();

router.get("/design/abstract", getFeesDesignAbstractLevelHandler);

export default router; 