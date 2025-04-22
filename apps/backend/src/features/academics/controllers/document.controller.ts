import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import { documentModel } from "@/features/academics/models/document.model.js";
import { db } from "@/db/index.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { getFile, scanExistingMarksheetFilesByRollNumber } from "../services/document.service.js";

//createDocum
export const createDocumentMetadata = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        console.log(req.body);
        const newDocumentModel = await db.insert(documentModel).values(req.body);
        console.log("New Document added", newDocumentModel);
        res
            .status(201)
            .json(
                new ApiResponse(201, "SUCCESS", null, "New Document is added to db!"),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

//getAllDocumentsMetadata
export const getAllDocumentsMetadata = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        console.log(req.body);
        const getAllDocumentsMetadata = await db.select().from(documentModel);
        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    getAllDocumentsMetadata,
                    "All Document fetched successfully.",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

//getDocumentMetadataById
export const getDocumentMetadataById = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.query;
        console.log(id);
        if (!id) {
            res.status(400).json(new ApiError(400, "Id is required"));
            return;
        }

        const document = await db
            .select()
            .from(documentModel)
            .where(eq(documentModel.id, +id))
            .then((documents) => documents[0]);

        if (!document) {
            res.status(404).json(new ApiError(404, "Document not found"));
            return;
        }

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    document,
                    "Document fetched successfully.",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

//getDocumentMetadataByName
export const getDocumentMetadataByName = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { name } = req.query;
        console.log(name);
        const document = await db
            .select()
            .from(documentModel)
            .where(eq(documentModel.name, name as string))
            .then((documents) => documents[0]);

        if (!document) {
            res.status(404).json(new ApiError(404, "Document not found"));
            return;
        }

        res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    "SUCCESS",
                    document,
                    "Document fetched successfully.",
                ),
            );
    } catch (error) {
        handleError(error, res, next);
    }
};

//updateDocumentMetadata
export const updateDocumentMetadata = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const updatedData = req.body;

        const existingDocument = await db
            .select()
            .from(documentModel)
            .where(eq(documentModel.id, +id))
            .then((documents) => documents[0]);

        if (!existingDocument) {
            res.status(404).json(new ApiError(404, "Document not found"));
            return;
        }

        const updatedDocument = await db
            .update(documentModel)
            .set(updatedData)
            .where(eq(documentModel.id, +id))
            .returning();

        if (updatedDocument.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        updatedDocument[0],
                        "Document updated successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Document not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};

//deleteDocumentMetadata
export const deleteDocumentMetadata = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { id } = req.params;
        console.log(id);
        const deletedDocument = await db
            .delete(documentModel)
            .where(eq(documentModel.id, +id))
            .returning();

        if (deletedDocument.length > 0) {
            res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "SUCCESS",
                        deletedDocument[0],
                        "Document deleted successfully!",
                    ),
                );
        } else {
            res.status(404).json(new ApiError(404, "Document not found"));
        }
    } catch (error) {
        handleError(error, res, next);
    }
};

//getDocument
export const getDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filePath } = req.body;

        if (!filePath) {
            res.status(400).json(new ApiResponse(400, "ERROR", null, "File path is required."));
            return;
        }

        const fileBuffer = await getFile(filePath);

        if (!fileBuffer) {
            res.status(404).json(new ApiResponse(404, "ERROR", null, "File not found."));
            return;
        }

        // Set correct content type for PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${filePath.split("/").pop()}"`);

        res.send(fileBuffer);
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getExistingMarksheetFilesByRollNumber = async (req: Request,
    res: Response,
    next: NextFunction,) => {
    try {
        const { framework, stream, rollNumber, semester } = req.body;

        const fileItems = await scanExistingMarksheetFilesByRollNumber({ framework, stream, rollNumber, semester });

        res.status(200).json(new ApiResponse(200, "SUCCESS", fileItems, "Files fetched successfully."));

    } catch (error) {
        handleError(error, res, next);
    }
}

//uploadDocument
export const uploadDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
    } catch (error) {
        handleError(error, res, next);
    }
};
