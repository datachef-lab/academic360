import express, { RequestHandler } from "express";
import { getAllReports } from "../controllers/report.controller.js";

const router = express.Router();

router.get("/query", getAllReports );

export default router;