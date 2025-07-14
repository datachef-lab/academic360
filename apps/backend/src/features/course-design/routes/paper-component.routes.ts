import { Router } from "express";
import {
  createPaperComponent,
  getAllPaperComponents,
  getPaperComponentById,
  updatePaperComponent,
  deletePaperComponent,
} from "../controllers/paper-component.controller";
import { RequestHandler } from "express";

const router = Router();

// Paper Component routes
router.post("/", createPaperComponent as RequestHandler);
router.get("/", getAllPaperComponents as RequestHandler);
router.get("/:id", getPaperComponentById as RequestHandler);
router.put("/:id", updatePaperComponent as RequestHandler);
router.delete("/:id", deletePaperComponent as RequestHandler);

export default router;
