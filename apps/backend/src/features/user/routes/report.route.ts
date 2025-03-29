import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import { getAllReports, getReportId } from "../controllers/report.controller";


// import { getAllReport, getStudentReportId } from "../controllers/report.controller";


const router = express.Router();

router.use(verifyJWT);
router.get("/:id",getReportId);
router.get("/", getAllReports); // Assuming you want to fetch by ID as well


export default router;