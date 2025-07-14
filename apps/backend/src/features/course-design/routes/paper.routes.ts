import { Router } from "express";
import {
  createPaper,
  getAllPapers,
  getPaperById,
  updatePaper,
  deletePaper,
} from "../controllers/paper.controller";
import { RequestHandler } from "express";

const router = Router();

// Paper routes
router.post("/", createPaper as RequestHandler);
router.get("/", getAllPapers as RequestHandler);
router.get("/:id", getPaperById as RequestHandler);
router.put("/:id", updatePaper as RequestHandler);
router.delete("/:id", deletePaper as RequestHandler);

export default router;
