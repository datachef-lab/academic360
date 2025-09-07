import { verifyJWT } from "@/middlewares/index.js";
import express from "express";
import {
  createSessionHandler,
  getAllSessionsHandler,
} from "../controllers/session.controller.js";

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

router.get("/", getAllSessionsHandler);
router.post("/", createSessionHandler);

export default router;
