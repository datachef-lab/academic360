import { db } from "@/db/index.ts";
import { NextFunction, Request, Response } from "express";
import { subjectMetadataModel } from "../models/subjectMetadata.model.ts";
import { ApiResponse } from "@/utils/ApiResonse.ts";
import { handleError } from "@/utils/handleError.ts";

export const createSubjectMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [newSubjectMetadata] = await db.insert(subjectMetadataModel).values(req.body).returning();

        res.status(201).json(new ApiResponse(201, "CREATED", newSubjectMetadata, "New subject-metadata created successfully!"));
    } catch (error: unknown) {
        handleError(error, res, next);
    }
}

export const getAllSubjectMetadatas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await db.select().from(subjectMetadataModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", users, "All subject-metadata fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getSubjectMetadataById = async (req: Request, res: Response, next: NextFunction) => {
    try {
       
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getSubjectMetadataByStreamId = async (req: Request, res: Response, next: NextFunction) => {
    try {
       
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getSubjectMetadataBySemester = async (req: Request, res: Response, next: NextFunction) => {
    try {
       
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getSubjectMetadataByStreamIdAndSemester = async (req: Request, res: Response, next: NextFunction) => {
    try {
       
    } catch (error) {
        handleError(error, res, next);
    }
}

export const updateSubjectMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
       
    } catch (error) {
        handleError(error, res, next);
    }
}

export const deleteSubjectMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
       
    } catch (error) {
        handleError(error, res, next);
    }
}