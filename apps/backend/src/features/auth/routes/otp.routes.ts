import { Router } from "express";
import {
  sendOtpToEmail,
  sendOtpToWhatsApp,
  verifyOtpAndLogin,
  resendOtp,
  checkOtpStatusController,
  testTimeCalculation,
} from "../controllers/otp.controller.js";

const router = Router();

// Send OTP to email
router.post("/send-email", sendOtpToEmail);

// Send OTP to WhatsApp
router.post("/send-whatsapp", sendOtpToWhatsApp);

// Verify OTP and login
router.post("/verify", verifyOtpAndLogin);

// Resend OTP
router.post("/resend", resendOtp);

// Check OTP status
router.get("/status", checkOtpStatusController);

// Test time calculation
router.get("/test-time", testTimeCalculation);

export default router;
