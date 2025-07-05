import express from "express";
import { getAllSectionsController } from "../controllers/section.controller.js";

const router = express.Router();
router.get("/", getAllSectionsController);
export default router; 