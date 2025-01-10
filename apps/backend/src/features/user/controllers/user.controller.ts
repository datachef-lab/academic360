import { db } from "@/db/index.js";
import { Request, RequestHandler, Response } from "express";
import { userModel } from "@/features/user/models/user.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";

export const createUser = async (req: Request, res: Response): Promise<void> => {
    console.log(req.body)
    try {
        const [newUser] = await db.insert(userModel).values(req.body).returning();

        res.status(201).json(new ApiResponse(201, "CREATED", newUser, "New user created successfully!"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiError(500, "Unable to create the student"));
    }
}

export const getAllUsers = async (req: Request, res: Response) => {

}

export const getUserById = async (req: Request, res: Response) => {

}

export const getUserByEmail = async (req: Request, res: Response) => {

}

export const updateUser = async (req: Request, res: Response) => {

}

export const toggleDisableUser = async (req: Request, res: Response) => {

}