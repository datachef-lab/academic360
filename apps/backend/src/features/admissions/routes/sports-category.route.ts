import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createSportsCategoryHandler,
  getSportsCategoryByIdHandler,
  getAllSportsCategoriesHandler,
  updateSportsCategoryHandler,
  deleteSportsCategoryHandler
} from "../controllers/sports-category.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", createSportsCategoryHandler);
router.get("/:id", getSportsCategoryByIdHandler);
router.get("/", getAllSportsCategoriesHandler);
router.put("/:id", updateSportsCategoryHandler);
router.delete("/:id", deleteSportsCategoryHandler);

export default router; 