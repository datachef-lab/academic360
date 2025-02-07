import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import { createOldStudent } from "../controllers/oldStudent.controller.js";

const router = express.Router();

// router.use(verifyJWT);

router.get("/old-data", createOldStudent);

export default router;