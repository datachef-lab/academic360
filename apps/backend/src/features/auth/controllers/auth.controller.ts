import "dotenv/config";
import type { StringValue } from "ms";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { userModel, User } from "@/features/user/models/user.model.js";
import { handleError } from "@/utils/handleError.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { generateToken } from "@/utils/generateToken.js";
import { addUser, findUserByEmail } from "@/features/user/services/user.service.js";
import { userTypeEnum } from "@/features/user/models/helper.js";

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
        console.log(email, password);
        const foundUser = await findUserByEmail(email);
        if (!foundUser) {
            res.status(401).json(new ApiError(401, "Please provide the valid credentials."));
            return;
        }

        if (foundUser.disabled) {
            res.status(403).json(new ApiError(403, "Your account is disabled. Please contact support."));
            return;
        }

        const isPasswordMatch = await bcrypt.compare(password, foundUser.password as string);

        if (!isPasswordMatch) {
            res.status(401).json(new ApiError(401, "Please provide the valid credentials."));
            return;
        }

        const accessToken = generateToken({ id: foundUser.id as number, type: foundUser.type as User["type"] }, process.env.ACCESS_TOKEN_SECRET!, process.env.ACCESS_TOKEN_EXPIRY! as StringValue);

        const refreshToken = generateToken({ id: foundUser.id as number, type: foundUser.type }, process.env.REFRESH_TOKEN_SECRET!, process.env.REFRESH_TOKEN_EXPIRY! as StringValue);

        // Create secure cookie with refresh token
        res.cookie("jwt", refreshToken, {
            httpOnly: true, // Accessible only by the web server
            secure: false, // Only sent over HTTPS
            // sameSite: "none", // Cross-site request forgery protection
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        });

        // Log cookies before sending response
        console.log("Cookies set in response:", res.getHeaders()["set-cookie"]);

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

        const accessToken = generateToken({ id: foundUser.id, type: foundUser.type as User["type"] }, process.env.ACCESS_TOKEN_SECRET!, process.env.ACCESS_TOKEN_EXPIRY! as StringValue);

        const refreshToken = generateToken({ id: foundUser.id, type: foundUser.type as User["type"] }, process.env.REFRESH_TOKEN_SECRET!, process.env.REFRESH_TOKEN_EXPIRY! as StringValue);

        // Create secure cookie with refresh token
        res.cookie("jwt", refreshToken, {
            httpOnly: true, // Accessible only by the web server
            secure: false, // Only sent over HTTPS
            // sameSite: "none", // Cross-site request forgery protection
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

                const accessToken = generateToken({ id: foundUser.id, type: foundUser.type }, process.env.ACCESS_TOKEN_SECRET!, process.env.ACCESS_TOKEN_EXPIRY! as StringValue);

                res.status(200).json(new ApiResponse(200, "SUCCESS", { accessToken, user: foundUser }, "Token refreshed"));
            });

    } catch (error) {
        handleError(error, res, next);
    }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("Fired")
        const cookies = req.cookies;
        console.log(cookies.jwt);
        if (!cookies.jwt) {
            res.status(204).json(new ApiError(204, "No content"));
            return;
        }
        console.log("Logging out...");
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: true,
            // sameSite: "none",
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

        // res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Logout successful"));

    } catch (error) {
        handleError(error, res, next);
    }
}