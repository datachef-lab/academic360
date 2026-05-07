import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createJournalTypeController,
  deleteJournalTypeController,
  getJournalTypeByIdController,
  getJournalTypeListController,
  updateJournalTypeController,
} from "@/features/library/controllers/journal-type.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getJournalTypeListController);
router.get("/:id", getJournalTypeByIdController);
router.post("/", createJournalTypeController);
router.put("/:id", updateJournalTypeController);
router.delete("/:id", deleteJournalTypeController);

export default router;
