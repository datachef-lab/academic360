import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import {  getAllReports, getReportId } from "../controllers/report.controller";

const router = express.Router();

router.use(verifyJWT);
router.get("/:id",getReportId);
router.get("/", getAllReports); 


export default router;