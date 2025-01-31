import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { userModel, User, userTypeEnum } from "@/features/user/models/user.model.ts";
import { handleError } from "@/utils/handleError.ts";
import { db } from "@/db/index.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { generateToken } from "@/utils/generateToken.ts";
import { addUser, findUserByEmail } from "@/features/user/services/user.service.ts";

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const givenUser = req.body as User;

    try {
        // Create a new user
        const newUser = await addUser(givenUser);

        res.status(201).json(new ApiResponse(
            201,
            "CREATED",
            newUser,
            "New user created successfully!"
        ));

    } catch (error: unknown) {
        handleError(error, res, next);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const foundUser = await findUserByEmail(email);
        if (!foundUser || foundUser.disabled) {
            res.status(401).json(new ApiError(401, "Unauthorized"));
            return;
        }

        const isPasswordMatch = await bcrypt.compare(password, foundUser.password);

        if (!isPasswordMatch) {
            res.status(401).json(new ApiError(401, "Unauthorized"));
            return;
        }

        const accessToken = generateToken({ id: foundUser.id as number, type: foundUser.type as User["type"] }, process.env.ACCESS_TOKEN_SECRET!, process.env.ACCESS_TOKEN_EXPIRY!);

        const refreshToken = generateToken({ id: foundUser.id as number, type: foundUser.type }, process.env.REFRESH_TOKEN_SECRET!, process.env.REFRESH_TOKEN_EXPIRY!);

        // Create secure cookie with refresh token
        res.cookie("jwt", refreshToken, {
            httpOnly: true, // Accessible only by the web server
            secure: false, // Only sent over HTTPS
            sameSite: "none", // Cross-site request forgery protection
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        });

        res.status(200).json(new ApiResponse(200, "SUCCESS", { accessToken, user: foundUser }, "Login successful"));

    } catch (error) {
        handleError(error, res, next);
    }
}

export const postGoogleLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Retrieve user from Passport
        const foundUser = req.user as { id: number; type: string };

        if (!foundUser) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const accessToken = generateToken({ id: foundUser.id, type: foundUser.type as User["type"] }, process.env.ACCESS_TOKEN_SECRET!, process.env.ACCESS_TOKEN_EXPIRY!);

        const refreshToken = generateToken({ id: foundUser.id, type: foundUser.type as User["type"] }, process.env.REFRESH_TOKEN_SECRET!, process.env.REFRESH_TOKEN_EXPIRY!);

        // Create secure cookie with refresh token
        res.cookie("jwt", refreshToken, {
            httpOnly: true, // Accessible only by the web server
            secure: false, // Only sent over HTTPS
            sameSite: "none", // Cross-site request forgery protection
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        });

        next();
    }
    catch (error) {
        handleError(error, res, next);
    }
}

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies.jwt;

        if (!refreshToken) {
            res.status(401).json(new ApiError(401, "Unauthorized"));
            return;
        }

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET!,
            async (err: unknown, decoded: any) => {
                const user = decoded as { id: number, type: typeof userTypeEnum.enumValues };
                if (err) {
                    res.status(403).json(new ApiError(403, "Forbidden"));
                    return;
                }

                const [foundUser] = await db.select().from(userModel).where(eq(userModel.id, user.id));
                if (!foundUser) {
                    res.status(401).json(new ApiError(404, "Unauthorized"));
                    return;
                }

                const accessToken = generateToken({ id: foundUser.id, type: foundUser.type }, process.env.ACCESS_TOKEN_SECRET!, process.env.ACCESS_TOKEN_EXPIRY!);

                res.status(200).json(new ApiResponse(200, "SUCCESS", { accessToken }, "Token refreshed"));
            });

    } catch (error) {
        handleError(error, res, next);
    }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cookies = req.cookies;
        if (!cookies.jwt) {
            res.status(204).json(new ApiError(204, "No content"));
            return;
        }
        console.log("Logging out...");
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        // Log out from Google (passport.js logout)
        req.logout((err) => {
            if (err) {
                return next(err); // Pass the error to the next middleware (error handler)
            }

            // Optionally, you can redirect the user to a logout confirmation page
            // or directly to the login page
            res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Logout successful"));
        });

        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Logout successful"));

    } catch (error) {
        handleError(error, res, next);
    }
}