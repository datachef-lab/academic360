import express from "express";
import { validateData } from "@/middlewares/validation.middleware.ts";
import { z } from "zod";
import { createStudentSchema, StudentType } from "@/features/academics/models/student.model.ts";


const router = express.Router();

router.post("/", validateData(createStudentSchema), (req, res) => {
    res.send("Okay.");
});


export default router;