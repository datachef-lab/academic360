import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  getBatchReceipts,
  getBatchReceiptScope,
  getLedgerForStudent,
  postBatchReceipt,
  postBatchReceiptGenerate,
  postLedgerCollected,
  postPromotionCountForScope,
  putBatchReceipt,
  putBatchReceiptMode,
  deleteBatchReceiptById,
} from "../controllers/document-batch-receipt.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getBatchReceipts);
router.post("/", postBatchReceipt);

// Live promotion-count for the create/edit dialog — before any batch exists.
router.post("/promotion-count", postPromotionCountForScope);
router.put("/:id", putBatchReceipt);
router.delete("/:id", deleteBatchReceiptById);

// How many promotions the scope resolves to — checked before enabling.
router.get("/:id/scope", getBatchReceiptScope);

// Enabling ADMINISTRATIVE here is what creates the ledger entries.
router.put("/:id/mode", putBatchReceiptMode);

// Top-up for promotions created after the first generation.
router.post("/:id/generate", postBatchReceiptGenerate);

// All ledger rows for a given student (the console's Student Ledger page).
router.get("/ledger/student/:studentId", getLedgerForStudent);

// Distribution.
router.post("/ledger/:ledgerId/collect", postLedgerCollected);

export default router;
