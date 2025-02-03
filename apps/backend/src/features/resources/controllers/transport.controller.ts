import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.ts";
import { transportModel } from "../models/transport.model.ts";
import { findAll } from "@/utils/helper.ts";


// Create a new Transport
export const createNewTransport = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        console.log(req.body);
        const newTransport = await db
            .insert(transportModel)
            .values(req.body);
        console.log("New Transport added", newTransport);
        res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    "SUCCESS",
                    null,
                    "New Transport is added to db!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get all Transport
export const getAllTransport = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const transport = await findAll(transportModel);
        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    transport,
                    "Fetched all transport!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Get Transport By ID
export const getTransportById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        const transport = await db
            .select()
            .from(transportModel)
            .where(eq(transportModel.id, Number(id)))
            .limit(1);

        if (!transport[0]) {
            res
                .status(404)
                .json(
                    new ApiResponse(404, "NOT_FOUND", null, "Transport not found"),
                );
            return;
        }

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    transport[0],
                    "Fetched Transport!",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

// Update the Transport
export const updateTransport = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const updatedTransport = req.body;

        const existingTransport = await db
            .select()
            .from(transportModel)
            .where(eq(transportModel.id, +id))
            .then((transport) => transport[0]);

        if (!existingTransport) {
            res.status(404).json(new ApiError(404, "Transport not found"));
            return;
        }

        const updatedTransports = await db
            .update(transportModel)
            .set(updatedTransport)
            .where(eq(transportModel.id, +id))
            .returning();

        if (updatedTransports.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        updatedTransports[0],
                        "Transport updated successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Transport not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};

// Delete the Transport
export const deleteTransport = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const deletedTransports = await db
            .delete(transportModel)
            .where(eq(transportModel.id, +id))
            .returning();

        if (deletedTransports.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        deletedTransports[0],
                        "Transports deleted successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Transports not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};
