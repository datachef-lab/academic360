
import { db } from "@/db/index.js";
import { NextFunction, Request, Response } from "express";
import { userModel } from "../models/user.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { eq } from "drizzle-orm";
import { handleError } from "@/utils/handleError.js";
import { findAllUsers, findUserByEmail, findUserById, saveUser, searchUser, toggleUser } from "../services/user.service.js";

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page,isAdmin, pageSize } = req.query;
        const pageParsed = Math.max(Number(page)||1,1);
        const pageSizeParsed =Math.max(Math.min(Number(pageSize)||10,100),1);
        const isAdminCheck = String(isAdmin).toLowerCase() === "true";

        const users = await findAllUsers(Number(pageParsed), Number(pageSizeParsed),isAdminCheck);

        res.status(200).json(new ApiResponse(200, "SUCCESS", users, "All users fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getSearchedUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, pageSize, searchText } = req.query;

        const users = await searchUser(searchText as string, Number(page), Number(pageSize));

        res.status(200).json(new ApiResponse(200, "SUCCESS", users, "All users fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (!id) {
        next();
    }

    try {
        const user = await findUserById(Number(id));

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
    const { email } = req.query;
    if (!email) {
        next();
    }

    try {
        const user = await findUserByEmail(email as string);

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
        const updatedUser = await saveUser(+id, updatedData);

        if (updatedUser) {
            res.status(200).json(new ApiResponse(200, "SUCCESS", updatedUser, "User updated successfully!"));
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
        const user = await toggleUser(+id);

        if (user) {
            res.status(200).json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    user,
                    `User ${user.disabled ? "disabled" : "enabled"} successfully!`
                )
            );
        } else {
            res.status(404).json(new ApiError(404, "User not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
}