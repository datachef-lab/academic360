import { Router } from "express";
import {
  initiatePaymentHandler,
  initiateFeePaymentHandler,
  getPaymentConfigHandler,
  getPaymentStatusHandler,
  confirmPaymentHandler,
  paymentCallbackHandler,
} from "../controllers/payment.controller.js";

const router = Router();

router.get("/config", getPaymentConfigHandler);
router.post("/initiate", initiatePaymentHandler);
router.post("/initiate-fee", initiateFeePaymentHandler);
router.get("/status/:orderId", getPaymentStatusHandler);
router.post("/confirm", confirmPaymentHandler);
router.post("/callback", paymentCallbackHandler);

export default router;
