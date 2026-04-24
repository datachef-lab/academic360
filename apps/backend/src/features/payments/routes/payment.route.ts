import { Router } from "express";
import {
  initiatePaymentHandler,
  initiateFeePaymentHandler,
  getPaymentConfigHandler,
  getPaymentStatusHandler,
  confirmPaymentHandler,
  paymentCallbackHandler,
  getOnlinePaymentAvailabilityHandler,
  paytmDowntimeWebhookHandler,
} from "../controllers/payment.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import {
  loadCashChallanHandler,
  loadOnlineOrderHandler,
  markOnlineSuccessManualHandler,
  receiveCashChallanHandler,
} from "../controllers/fee-payment-marking.controller.js";

const router = Router();

router.get("/config", getPaymentConfigHandler);
router.get("/availability", getOnlinePaymentAvailabilityHandler);
router.post("/initiate", initiatePaymentHandler);
router.post("/initiate-fee", initiateFeePaymentHandler);
router.get("/status/:orderId", getPaymentStatusHandler);
router.post("/confirm", confirmPaymentHandler);
router.post("/callback", paymentCallbackHandler);
router.post("/downtime/webhook", paytmDowntimeWebhookHandler);

// Fee payment marking (manual cash / online)
router.get("/marking/cash", verifyJWT, loadCashChallanHandler);
router.post("/marking/cash/receive", verifyJWT, receiveCashChallanHandler);
router.get("/marking/online", verifyJWT, loadOnlineOrderHandler);
router.post(
  "/marking/online/mark-success",
  verifyJWT,
  markOnlineSuccessManualHandler,
);

export default router;
