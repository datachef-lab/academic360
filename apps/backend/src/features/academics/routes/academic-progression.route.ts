import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import { getMyAcademicProgressionHandler } from "../controllers/academic-progression.controller.js";

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(verifyJWT);

router.get("/me", getMyAcademicProgressionHandler);

export default router;
