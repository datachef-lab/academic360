
import { db } from "@/db/index.js";
import { NextFunction, Request, Response } from "express";
import { userModel } from "../models/user.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { eq } from "drizzle-orm";
import { handleError } from "@/utils/handleError.js";

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    try {
        const [newUser] = await db.insert(userModel).values(req.body).returning();

        res.status(201).json(new ApiResponse(201, "CREATED", newUser, "New user created successfully!"));
    } catch (error: unknown) {
        handleError(error, res, next);
    }
};


export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await db.select().from(userModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", users, "All users fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = Number(id);

    try {
        const user = await db.select().from(userModel).where(eq(userModel.id, userId)).then((users) => users[0]);

        if (user) {
            res.status(200).json(new ApiResponse(200, "SUCCESS", user, "User fetched successfully!"));
        } else {
            res.status(404).json(new ApiError(404, "User not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.params;

    try {
        const user = await db.select().from(userModel).where(eq(userModel.email, email)).then((users) => users[0]);

        if (user) {
            res.status(200).json(new ApiResponse(200, "SUCCESS", user, "User fetched successfully!"));
        } else {
            res.status(404).json(new ApiError(404, "User not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const updatedUser = await db.update(userModel).set(updatedData).where(eq(userModel.id, +id)).returning();

        if (updatedUser.length > 0) {
            res.status(200).json(new ApiResponse(200, "SUCCESS", updatedUser[0], "User updated successfully!"));
        } else {
            res.status(404).json(new ApiError(404, "User not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
}

export const toggleDisableUser = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
        // Fetch the current user status
        const user = await db.select().from(userModel).where(eq(userModel.id, +id)).then((users) => users[0]);

        if (user) {
            const updatedStatus = !user.disabled;
            const updatedUser = await db.update(userModel).set({ disabled: updatedStatus }).where(eq(userModel.id, +id)).returning();

            res.status(200).json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    updatedUser[0],
                    `User ${updatedStatus ? "disabled" : "enabled"} successfully!`
                )
            );
        } else {
            res.status(404).json(new ApiError(404, "User not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
}