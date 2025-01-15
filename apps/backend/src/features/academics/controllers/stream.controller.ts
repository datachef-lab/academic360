import { NextFunction, Request, Response } from "express";
import { streamModel } from "../models/stream.model.js";
import { db } from "@/db/index.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { ApiError } from "@/utils/ApiError.js";

export const getStreams = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const streams = await db.select().from(streamModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", streams, "STREAMS FETCHED SUCCESSFULLY"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const createStream = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log(req.body);
        const { name, level } = req.body;

        // Validation for `name`
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            res.status(400).json(new ApiError(400, "Invalid name provided."));
            return;
        }

        // Validation for `level`
        if (level && !["UNDER_GRADUATE", "POST_GRADUATE"].includes(level)) {
            res.status(400).json(new ApiError(400, "Invalid level. Accepted values are UNDER_GRADUATE or POST_GRADUATE."));
            return;
        }

        const newStream = await db.insert(streamModel).values({
            name: name.trim(),
            level: level.trim(),
        });
        console.log("new stream added", newStream);
        res.status(201).json(new ApiResponse(201, "SUCCESS", null, "new steam is added to db"));

    } catch (error) {
        handleError(error, res, next);
    }
};