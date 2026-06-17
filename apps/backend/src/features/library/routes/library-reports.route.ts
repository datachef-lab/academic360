import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  getAisheReport,
  getNaacReport,
  getNirfReport,
} from "@/features/library/controllers/library-reports.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/naac", getNaacReport);
router.get("/nirf", getNirfReport);
router.get("/aishe", getAisheReport);
export default router;
