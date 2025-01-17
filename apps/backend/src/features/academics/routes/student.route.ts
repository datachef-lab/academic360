import express from "express";
import { createStudent } from "../controllers/student.controller.ts";

const router = express.Router();

router.post("/", createStudent);


export default router;