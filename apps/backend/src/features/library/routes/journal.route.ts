import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createJournalController,
  deleteJournalController,
  downloadJournalExcelController,
  getJournalByIdController,
  getJournalLinkedBooksController,
  getJournalListController,
  getJournalMetaController,
  updateJournalController,
} from "@/features/library/controllers/journal.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/meta", getJournalMetaController);
router.get("/download", downloadJournalExcelController);
router.get("/", getJournalListController);
router.get("/:id/linked-books", getJournalLinkedBooksController);
router.get("/:id", getJournalByIdController);
router.post("/", createJournalController);
router.put("/:id", updateJournalController);
router.delete("/:id", deleteJournalController);

export default router;
