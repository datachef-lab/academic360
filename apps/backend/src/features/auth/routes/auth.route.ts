import express from "express";
import {
  createUser,
  login,
  logout,
  postGoogleLogin,
  refresh,
  requestPasswordReset,
  resetPassword,
  validateResetToken,
  simplePasswordReset,
} from "../controllers/auth.controller.js";
import otpRouter from "./otp.routes.js";

import { loginLimiter } from "@/middlewares/loginLimiter.middleware.js";
import { validateData } from "@/middlewares/validation.middleware.js";
import { createUserSchema } from "@repo/db/schemas/models/user";
import passport from "passport";

const router = express.Router();

router.post("/", createUser);

router.post("/login", loginLimiter, login);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CORS_ORIGIN!}/login`,
  }),
  postGoogleLogin,
  (req, res) => {
    console.log("Redirecting to the frontend...");
    res.redirect(`${process.env.CORS_ORIGIN}/dashboard`);
  },
);

router.get("/refresh", refresh);

router.get("/logout", logout);

// Password Reset Routes (no JWT required)
router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/reset", resetPassword);
router.get("/password-reset/validate/:token", validateResetToken);

// Simple Password Reset (for testing - accepts email and new password directly)
router.post("/simple-password-reset", simplePasswordReset);

// OTP routes
router.use("/otp", otpRouter);

export default router;
