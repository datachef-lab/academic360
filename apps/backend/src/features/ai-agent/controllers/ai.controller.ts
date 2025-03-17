import { NextFunction, Request, Response } from "express";
import {  generateQuery } from "../services/ai.service.js";
import { handleError } from "@/utils/index.js";

export const aiChat = async (req: Request, res: Response, next: NextFunction) => {
    const { userId, message, threadId } = req.body;

    try {
        const result = await generateQuery(message);
        res.json(result);
    } catch (error) {
        handleError(error, res, next)
    }
}