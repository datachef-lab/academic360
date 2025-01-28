import { verifyJWT } from "@/middlewares/verifyJWT.ts";
import express from "express";
import { createOldStudent } from "../controllers/oldStudent.controller.ts";

const router = express.Router();

router.use(verifyJWT);

router.get("/old-data", createOldStudent);

export default router;