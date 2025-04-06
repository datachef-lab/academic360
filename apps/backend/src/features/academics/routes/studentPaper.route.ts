import express from "express";

import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { getStudentPapers } from "../controllers/studentPaper.controller.js";

const router = express.Router();

// router.use(verifyJWT);

router.get("/papers", getStudentPapers);



export default router;

