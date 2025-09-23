import express from "express";
import mappingRouter from "../controllers/board-subject-univ-subject-mapping.controller.js";
import { verifyJWT } from "@/middlewares/index.js";

const router = express.Router();

// Protect all endpoints
router.use(verifyJWT);
router.use("/", mappingRouter);

export default router;
