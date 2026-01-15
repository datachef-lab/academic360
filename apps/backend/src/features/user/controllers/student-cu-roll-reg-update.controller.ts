import { Request, Response, NextFunction } from "express";
import { ApiResponse, handleError } from "@/utils/index.js";
import { readExcelFromBuffer } from "@/utils/readExcel.js";
import { updateStudentCuRollAndRegistration } from "../services/student.service.js";

type ParsedCuRow = {
  rowNumber: number;
  uid: string;
  cuRollNumber: string | null;
  cuRegistrationNumber: string | null;
};

function normalizeHeaderKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, " ");
}

function toCellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Update CU Roll Number + CU Registration Number from Excel file
 *
 * @description
 * - Accepts an Excel file with headers: "UID", "CU Roll Number", "CU Registration Number"
 * - Matches students by UID using trim + case-insensitive comparison
 * - Updates students.rollNumber and students.registrationNumber
 *
 * @usage
 * - POST /api/students/update-cu-roll-reg
 * - multipart/form-data with field name: file
 */
export const updateCuRollAndRegistrationFromExcel = async (
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

    const rawRows = readExcelFromBuffer<Record<string, unknown>>(file.buffer);
    if (!rawRows || rawRows.length === 0) {
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

    const firstRow = rawRows[0] ?? {};
    const headerMap = new Map<string, string>();
    for (const key of Object.keys(firstRow)) {
      headerMap.set(normalizeHeaderKey(key), key);
    }

    const uidKey = headerMap.get("uid");
    const rollKey = headerMap.get("cu roll number");
    const regKey = headerMap.get("cu registration number");

    const missing: string[] = [];
    if (!uidKey) missing.push("UID");
    if (!rollKey) missing.push("CU Roll Number");
    if (!regKey) missing.push("CU Registration Number");

    if (missing.length > 0) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            `Missing required columns: ${missing.join(", ")}`,
          ),
        );
      return;
    }

    // At this point keys are guaranteed to exist
    const uidKeyStr = uidKey as string;
    const rollKeyStr = rollKey as string;
    const regKeyStr = regKey as string;

    const parsedRows: ParsedCuRow[] = rawRows.map((row, idx) => {
      const uid = toCellString(row[uidKeyStr]);
      const cuRollNumber = toCellString(row[rollKeyStr]) || null;
      const cuRegistrationNumber = toCellString(row[regKeyStr]) || null;
      // rowNumber in Excel: header is row 1, data starts at row 2
      return {
        rowNumber: idx + 2,
        uid,
        cuRollNumber,
        cuRegistrationNumber,
      };
    });

    const userId = (req as any)?.user?.id as number | undefined;
    const result = await updateStudentCuRollAndRegistration(
      parsedRows,
      userId ? userId.toString() : undefined,
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          `CU Roll/Registration update completed. ${result.updated} students updated.`,
        ),
      );
  } catch (error: any) {
    console.error("[CU ROLL/REG UPDATE] Error:", error);
    handleError(error, res, next);
  }
};
