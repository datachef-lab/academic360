import { loginLimiter } from "@/middlewares/loginLimiter.middleware.ts";
import express from "express";
import { createUser, login, logout, refresh } from "../controllers/auth.controller.ts";
import { validateData } from "@/middlewares/validation.middleware.ts";
import { createUserSchema } from "@/features/user/models/user.model.ts";


const router = express.Router();

router.post('/', validateData(createUserSchema), createUser);

router.post("/login", loginLimiter, login);

router.get("/refresh", refresh);

router.post("/logout", logout);

export default router;