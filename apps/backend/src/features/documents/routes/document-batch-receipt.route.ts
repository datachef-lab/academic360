import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  getBatchReceipts,
  getBatchReceiptScope,
  postBatchReceipt,
  postBatchReceiptGenerate,
  postLedgerCollected,
  putBatchReceipt,
  putBatchReceiptMode,
  deleteBatchReceiptById,
} from "../controllers/document-batch-receipt.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/", getBatchReceipts);
router.post("/", postBatchReceipt);
router.put("/:id", putBatchReceipt);
router.delete("/:id", deleteBatchReceiptById);

// How many promotions the scope resolves to — checked before enabling.
router.get("/:id/scope", getBatchReceiptScope);

// Enabling ADMINISTRATIVE here is what creates the ledger entries.
router.put("/:id/mode", putBatchReceiptMode);

// Top-up for promotions created after the first generation.
router.post("/:id/generate", postBatchReceiptGenerate);

// Distribution.
router.post("/ledger/:ledgerId/collect", postLedgerCollected);

export default router;
