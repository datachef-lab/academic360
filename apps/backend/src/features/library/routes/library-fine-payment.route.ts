import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  initiateLibraryFinePaymentController,
  recordLibraryFineCashPaymentController,
  settleLibraryFinePaymentController,
  waiveLibraryFineController,
} from "@/features/library/controllers/library-fine-payment.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.post("/:circulationId/initiate", initiateLibraryFinePaymentController);
router.post("/:circulationId/cash", recordLibraryFineCashPaymentController);
router.post("/:circulationId/waive", waiveLibraryFineController);
router.post("/payments/:paymentId/settle", settleLibraryFinePaymentController);
export default router;
