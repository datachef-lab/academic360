import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import { getAllReports } from "../controllers/report.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/query", getAllReports);


export default router;