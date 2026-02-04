import { Router } from "express";
import * as receiptTypeController from "../controllers/receipt-type.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

router.post("/", receiptTypeController.createReceiptType);
router.get("/", receiptTypeController.getAllReceiptTypes);
router.get("/:id", receiptTypeController.getReceiptTypeById);
router.put("/:id", receiptTypeController.updateReceiptType);
router.delete("/:id", receiptTypeController.deleteReceiptType);

export default router;
