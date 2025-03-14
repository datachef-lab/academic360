import { verifyJWT } from "@/middlewares/index.js";
import express from "express";
import { oldBatchesPapers } from "../controllers/batchPaper.controller.js";

const router = express.Router();

// router.use(verifyJWT);

router.get("/", oldBatchesPapers);

export default router;