import { Router } from "express";
import * as receiptTypeController from "../controllers/receipt-type.controller.js";

const router = Router();

router.post("/", receiptTypeController.createReceiptType);
router.get("/", receiptTypeController.getAllReceiptTypes);
router.get("/:id", receiptTypeController.getReceiptTypeById);
router.put("/:id", receiptTypeController.updateReceiptType);
router.delete("/:id", receiptTypeController.deleteReceiptType);

export default router;
