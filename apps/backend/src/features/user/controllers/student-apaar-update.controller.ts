import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { ApiResponse, handleError } from "@/utils/index.js";
import { updateStudentApaarIds } from "../services/student.service.js";
import { readExcelFromBuffer } from "@/utils/readExcel.js";
import XLSX from "xlsx";

// Configure multer for file upload - using memory storage since we only need to read the file once
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Check if file is Excel format
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are allowed"));
    }
  },
  // No file size limits - backend handles conversion and compression
});

// Middleware for file upload
export const uploadMiddleware = upload.single("file");

/**
 * Update APAAR IDs from Excel file
 *
 * @description
 * - Accepts an Excel file with columns: "College UID", "Student Name", "APAAR ID"
 * - Updates APAAR IDs for students found in the system
 * - Returns JSON response if all students are found
 * - Returns JSON response with not found UIDs if some students are not found
 * - Returns Excel file download if ?download=true is added to URL and some students are not found
 *
 * @response
 * - Success (all found): JSON with update statistics
 * - Success (some not found): JSON with not found UIDs list
 * - Success (some not found + ?download=true): Excel file download with not found UIDs
 * - Error: JSON with error details
 *
 * @usage
 * - Normal: POST /api/students/update-apaar-ids
 * - With Excel download: POST /api/students/update-apaar-ids?download=true
 */
export const updateApaarIdsFromExcel = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "BAD_REQUEST", null, "Excel file is required"),
        );
      return;
    }

    console.info(`[APAAR UPDATE] Processing file: ${file.originalname}`);

    // Read Excel file from buffer (no file system operations needed)
    const apaarIdRows = readExcelFromBuffer<{
      "College UID": string;
      "Student Name": string;
      "APAAR ID": string;
    }>(file.buffer);

    if (!apaarIdRows || apaarIdRows.length === 0) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "No data found in Excel file",
          ),
        );
      return;
    }

    console.info(
      `[APAAR UPDATE] Found ${apaarIdRows.length} rows in Excel file`,
    );

    // Validate required columns
    const requiredColumns = ["College UID", "Student Name", "APAAR ID"];
    const firstRow = apaarIdRows[0];
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

    if (missingColumns.length > 0) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            `Missing required columns: ${missingColumns.join(", ")}`,
          ),
        );
      return;
    }

    // Update APAAR IDs
    const result = await updateStudentApaarIds(apaarIdRows);

    console.info(
      `[APAAR UPDATE] Completed: ${result.updated} updated, ${result.errors.length} errors, ${result.notFound.length} not found`,
    );

    // If there are not found UIDs, check if client wants file download or JSON response
    if (result.notFound.length > 0) {
      console.info(
        `[APAAR UPDATE] Found ${result.notFound.length} not found UIDs`,
      );

      // Check if client wants file download (via Accept header or query parameter)
      const wantsFile =
        req.headers.accept?.includes(
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ) || req.query.download === "true";

      if (wantsFile) {
        console.info(
          `[APAAR UPDATE] Generating Excel file for ${result.notFound.length} not found UIDs`,
        );

        // Create Excel data for not found UIDs
        const notFoundData = result.notFound.map((uid) => ({
          "College UID": uid,
          Status: "Student not found",
          Note: "This UID does not exist in the system",
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(notFoundData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Not Found UIDs");

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });

        // Set response headers for file download
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `not-found-uids-${timestamp}.xlsx`;

        // Clear any existing headers and set proper file download headers
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`,
        );
        res.setHeader("Content-Length", excelBuffer.length);
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Pragma", "no-cache");

        // Send the Excel file as binary data
        res.status(200).end(excelBuffer);
        return;
      } else {
        // Return JSON response with not found UIDs
        const responseData = {
          totalProcessed: apaarIdRows.length,
          updated: result.updated,
          errors: result.errors,
          notFound: result.notFound,
          success: result.success,
          message: `${result.notFound.length} students not found. Add ?download=true to URL to get Excel file with not found UIDs.`,
        };

        res
          .status(200)
          .json(
            new ApiResponse(
              200,
              "SUCCESS_WITH_NOT_FOUND",
              responseData,
              `APAAR ID update completed. ${result.updated} students updated, ${result.notFound.length} not found.`,
            ),
          );
        return;
      }
    }

    // If no not found UIDs, return JSON response
    const responseData = {
      totalProcessed: apaarIdRows.length,
      updated: result.updated,
      errors: result.errors,
      notFound: result.notFound,
      success: result.success,
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          responseData,
          `APAAR ID update completed. ${result.updated} students updated successfully.`,
        ),
      );
  } catch (error: any) {
    console.error("[APAAR UPDATE] Error:", error);
    handleError(error, res, next);
  }
};
