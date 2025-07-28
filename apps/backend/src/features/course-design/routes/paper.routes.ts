import { Router } from "express";
import {
  createPaperHandler,
  getAllPapersHandler,
  getPaperByIdHandler,
  updatePaperHandler,
  deletePaperHandler,
} from "../controllers/paper.controller.js";
import { RequestHandler } from "express";

const router = Router();

// Paper routes
router.post("/", createPaperHandler as RequestHandler);
router.get("/", getAllPapersHandler as RequestHandler);
router.get("/:id", getPaperByIdHandler as RequestHandler);
router.put("/:id", updatePaperHandler as RequestHandler);
router.delete("/:id", deletePaperHandler as RequestHandler);

export default router;
