
import { db } from "@/db/index.js";
import { NextFunction, Request, Response } from "express";
import { subjectMetadataModel } from "@/features/academics/models/subjectMetadata.model.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import { eq, and } from "drizzle-orm";

export const createSubjectMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [newSubjectMetadata] = await db.insert(subjectMetadataModel).values(req.body).returning();
        res.status(201).json(new ApiResponse(201, "CREATED", newSubjectMetadata, "New subject-metadata created successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllSubjectMetadatas = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await db.select().from(subjectMetadataModel);
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "All subject-metadata fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getSubjectMetadataById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "ID is required"));
        }

        const [existingSubject] = await db.select().from(subjectMetadataModel).where(eq(subjectMetadataModel.id, Number(id)));

        console.log(existingSubject);

        if (!existingSubject) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Subject-metadata not found!"));
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", existingSubject, "Subject-metadata fetched successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const getSubjectMetadataByStreamId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { streamId } = req.query;
        const records = await db.select().from(subjectMetadataModel).where(eq(subjectMetadataModel.streamId, Number(streamId)));
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Subject-metadata fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getSubjectMetadataBySemester = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { semester } = req.query;
        const records = await db.select().from(subjectMetadataModel).where(eq(subjectMetadataModel.semester, Number(semester)));
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Subject-metadata fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getSubjectMetadataByStreamIdAndSemester = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { streamId, semester } = req.query;
        const records = await db
            .select()
            .from(subjectMetadataModel)
            .where(
                and(
                    eq(subjectMetadataModel.streamId, Number(streamId)),
                    eq(subjectMetadataModel.semester, Number(semester))
                )
            );
        res.status(200).json(new ApiResponse(200, "SUCCESS", records, "Subject-metadata fetched successfully!"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateSubjectMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const [updatedRecord] = await db.update(subjectMetadataModel).set(updatedData).where(eq(subjectMetadataModel.id, Number(id))).returning();
        if (!updatedRecord) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Subject-metadata not found!"));
        }
        res.status(200).json(new ApiResponse(200, "UPDATED", updatedRecord, "Subject-metadata updated successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteSubjectMetadata = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const deletedRecord = await db.delete(subjectMetadataModel).where(eq(subjectMetadataModel.id, Number(id))).returning();
        if (!deletedRecord.length) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Subject-metadata not found!"));
        }
        res.status(200).json(new ApiResponse(200, "DELETED", deletedRecord[0], "Subject-metadata deleted successfully!"));

    } catch (error) {
        handleError(error, res, next);
    }
};
