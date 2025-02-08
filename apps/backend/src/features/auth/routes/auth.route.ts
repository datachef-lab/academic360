import express from "express";
import { createUser, login, logout, postGoogleLogin, refresh } from "../controllers/auth.controller.js";

import { loginLimiter } from "@/middlewares/loginLimiter.middleware.js";
import { validateData } from "@/middlewares/validation.middleware.js";
import { createUserSchema } from "@/features/user/models/user.model.js";
import passport from "passport";

const router = express.Router();

router.post('/', validateData(createUserSchema), createUser);

router.post("/login", loginLimiter, login);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google", {
    failureRedirect: `${process.env.CORS_ORIGIN!}/login`
}), postGoogleLogin, (req, res) => {
    console.log("Redirecting to the frontend...");
    res.redirect(`${process.env.CORS_ORIGIN}/home`);
});

router.get("/refresh", refresh);

router.get("/logout", logout);

export default router;