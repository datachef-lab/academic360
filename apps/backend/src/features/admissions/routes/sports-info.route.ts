import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createSportsInfoHandler,
  getSportsInfoByIdHandler,
  getSportsInfoByAdditionalInfoIdHandler,
  updateSportsInfoHandler,
  deleteSportsInfoHandler
} from "../controllers/sports-info.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createSportsInfoHandler);
router.get("/:id", getSportsInfoByIdHandler);
router.get("/additional-info/:additionalInfoId", getSportsInfoByAdditionalInfoIdHandler);
router.put("/:id", updateSportsInfoHandler);
router.delete("/:id", deleteSportsInfoHandler);

export default router; 