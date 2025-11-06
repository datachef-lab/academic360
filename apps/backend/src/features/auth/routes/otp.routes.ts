import { Router } from "express";
import {
  sendOtpToEmail,
  sendOtpToWhatsApp,
  verifyOtpAndLogin,
  resendOtp,
  checkOtpStatusController,
  testTimeCalculation,
  lookupUserByEmail,
  lookupUsersByUidPrefix,
  verifyOtpOnly,
} from "../controllers/otp.controller.js";
import { adminBypassOtpLogin } from "../controllers/auth.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = Router();

// Send OTP to email
router.post("/send-email", sendOtpToEmail);

// Send OTP to WhatsApp
router.post("/send-whatsapp", sendOtpToWhatsApp);

// Verify OTP and login
router.post("/verify", verifyOtpAndLogin);
// Verify OTP only (no login)
router.post("/verify-only", verifyOtpOnly);

// Resend OTP
router.post("/resend", resendOtp);

// Check OTP status
router.get("/status", checkOtpStatusController);

// Test time calculation
router.get("/test-time", testTimeCalculation);

// Lookup user by email (no side effects)
router.get("/lookup", lookupUserByEmail);

// Prefix lookup for live typing
router.get("/lookup-prefix", lookupUsersByUidPrefix);

// Admin bypass OTP login for student console simulation
// Can be called with admin token in X-Admin-Bypass-Token header OR via JWT middleware
router.post("/admin-bypass", adminBypassOtpLogin);

export default router;
