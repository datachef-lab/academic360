import { NextFunction, Request, Response } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import {
    loadOlderBatches,
    loadStudentSubjects,
    refactorBatchSession,
    createBatch,
    getAllBatches,
    findBatchById,
    updateBatch,
    deleteBatch,
    uploadBatch
} from "../services/batch.service.js";
import { readExcelFile } from "@/utils/readExcel.js";
import { writeExcelFile } from "@/utils/writeExcel.js";
import path from "path";
import fs from "fs";

export const oldBatches = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await loadOlderBatches();
        // await loadStudentSubjects();
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Loaded old data"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const refactorBatchSessionC = async (req: Request, res: Response, next: NextFunction) => {
    console.log("first")
    try {
        await refactorBatchSession();
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "refactorBatchSession"));
    } catch (error) {
        handleError(error, res, next);
    }
}

// --- CRUD Controllers ---
export const createBatchController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const batch = await createBatch(req.body);
        res.status(201).json(new ApiResponse(201, "SUCCESS", batch, "Batch created successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getAllBatchesController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const batches = await getAllBatches();
        res.status(200).json(new ApiResponse(200, "SUCCESS", batches, "Batches fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const getBatchByIdController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const batch = await findBatchById(id);
        if (!batch) {
            return res.status(404).json(new ApiResponse(404, "FAIL", null, "Batch not found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", batch, "Batch fetched successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const updateBatchController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const batch = await updateBatch(id, req.body);
        if (!batch) {
            return res.status(404).json(new ApiResponse(404, "FAIL", null, "Batch not found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", batch, "Batch updated successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const deleteBatchController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        const deleted = await deleteBatch(id);
        if (!deleted) {
            return res.status(404).json(new ApiResponse(404, "FAIL", null, "Batch not found"));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", null, "Batch deleted successfully"));
    } catch (error) {
        handleError(error, res, next);
    }
};

export const batchUploadController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json(new ApiResponse(400, "FAIL", null, "No file uploaded"));
        }
        // Parse Excel file to BatchStudentRow[]
        const rows = await readExcelFile<unknown>(req.file.path); // You may need to cast/validate to BatchStudentRow[]
        const result = await uploadBatch(rows as any); // Add validation as needed
        if (!result.success && result.exceptions && result.exceptions.length > 0) {
            // Write exceptions (invalid + valid) to Excel, invalid at top in red
            const tempDir = path.join(__dirname, "../../../public/data");
            const fileName = `batch-upload-exceptions-${Date.now()}`;
            writeExcelFile(tempDir, fileName, result.exceptions);
            const filePath = path.join(tempDir, `${fileName}.xlsx`);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            fileStream.on('close', () => {
                // Optionally delete the file after sending
                fs.unlink(filePath, () => {});
            });
            return;
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", result, "Batch upload processed"));
    } catch (error) {
        handleError(error, res, next);
    }
};