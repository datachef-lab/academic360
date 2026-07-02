import express, { Request } from "express";
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
import { setService } from "@/utils/setService.js";
import { allowedOrigins } from "@/config/allowedOrigins.js";

// All allowed frontend origins parsed from the comma-separated CORS_ORIGIN env var,
// plus localhost fallbacks for development.
const knownFrontendOrigins = [
  ...(process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean),
  "http://localhost:5173",
  "http://localhost:3008",
];

// Default redirect target: first entry in CORS_ORIGIN or localhost.
const defaultFrontendOrigin =
  knownFrontendOrigins[0] ?? "http://localhost:5173";

function getReturnOrigin(req: Request): string {
  // Prefer what we stored in the session when the flow started.
  const sessionOrigin = (req.session as unknown as Record<string, unknown>)
    ?.googleReturnOrigin as string | undefined;
  if (sessionOrigin && knownFrontendOrigins.includes(sessionOrigin)) {
    return sessionOrigin;
  }
  return defaultFrontendOrigin;
}

const router = express.Router();
router.use(setService("auth"));
router.post("/", createUser);

router.post("/login", loginLimiter, login);

// Capture which frontend initiated Google login so we can redirect back to it
// after the OAuth callback (the callback comes from Google, not from our frontend).
router.get(
  "/google",
  (req, res, next) => {
    const origin =
      (req.get("origin") ?? "").replace(/\/$/, "") ||
      (req.get("referer") ?? "").replace(/\/[^/]*$/, "").replace(/\/$/, "");

    if (origin && knownFrontendOrigins.includes(origin)) {
      (req.session as unknown as Record<string, unknown>).googleReturnOrigin =
        origin;
    }

    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  (req, res, next) => {
    const returnOrigin = getReturnOrigin(req);
    passport.authenticate("google", {
      failureRedirect: `${returnOrigin}/login`,
    })(req, res, next);
  },
  postGoogleLogin,
  (req, res) => {
    const returnOrigin = getReturnOrigin(req);
    delete (req.session as unknown as Record<string, unknown>)
      .googleReturnOrigin;
    console.log("Redirecting to the frontend...", returnOrigin);
    res.redirect(`${returnOrigin}/dashboard`);
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
