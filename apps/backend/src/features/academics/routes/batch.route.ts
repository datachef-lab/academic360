import { verifyJWT } from "@/middlewares/index.js";
import express from "express";
import { oldBatches } from "../controllers/batch.controller.js";

const router = express.Router();

// router.use(verifyJWT);

router.get("/", oldBatches);

export default router;