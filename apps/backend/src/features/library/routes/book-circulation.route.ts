import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  downloadBookCirculationExcelController,
  getBookCirculationListController,
  getBookCirculationMetaController,
  getBookCirculationPolicyController,
  getBookCirculationPreviewController,
  performBookCirculationActionController,
  searchBookCirculationBookOptionsController,
  upsertBookCirculationRowsController,
} from "@/features/library/controllers/book-circulation.controller.js";

const router = express.Router();
router.use(verifyJWT);

router.get("/", getBookCirculationListController);
router.get("/meta", getBookCirculationMetaController);
router.get("/policy", getBookCirculationPolicyController);
router.get("/book-options", searchBookCirculationBookOptionsController);
router.get("/download", downloadBookCirculationExcelController);
router.get("/preview/:userId", getBookCirculationPreviewController);
router.post("/upsert/:userId", upsertBookCirculationRowsController);
router.post("/:id/action", performBookCirculationActionController);

export default router;
