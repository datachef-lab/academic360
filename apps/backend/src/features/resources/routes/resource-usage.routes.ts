import express from "express";

import { getResourceUsage } from "@/features/resources/controllers/resource-usage.controller.js";

const router = express.Router();

router.get("/:table", getResourceUsage);

export default router;
