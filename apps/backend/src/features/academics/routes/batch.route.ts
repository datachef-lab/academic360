import { verifyJWT } from "@/middlewares/index.js";
import express from "express";
import { oldBatches, refactorBatchSessionC } from "../controllers/batch.controller.js";

const router = express.Router();

// router.use(verifyJWT);

router.get("/", oldBatches);
router.get("/refactorBatchSession", refactorBatchSessionC);

export default router;