import express from "express";


import { createUser, login, logout, postGoogleLogin, refresh } from "../controllers/auth.controller.ts";

import { loginLimiter } from "@/middlewares/loginLimiter.middleware.ts";
import { validateData } from "@/middlewares/validation.middleware.ts";
import { createUserSchema } from "@/features/user/models/user.model.ts";
import passport from "passport";

const router = express.Router();

router.post('/', validateData(createUserSchema), createUser);

router.post("/login", loginLimiter, login);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google", {
    failureRedirect: `${process.env.CORS_ORIGIN!}/login`
}), postGoogleLogin, (req, res) => {
    console.log("Redirecting to the frontend...");
    res.redirect("http://localhost:8080/api/users/");
});

router.get("/refresh", refresh);

router.post("/logout", logout);

export default router;