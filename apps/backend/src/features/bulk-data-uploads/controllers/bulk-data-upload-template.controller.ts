import { Request, Response, NextFunction } from "express";
import XLSX from "xlsx";
import { z } from "zod";
import {
  CU_REG_ROLL_EXCEL_COLUMNS,
  EXAM_FORM_FILLUP_EXCEL_COLUMNS,
} from "../services/index.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

const templateModeSchema = z.enum(["cu-reg-roll", "exam-form-fillup"]);

/**
 * GET /api/v1/bulk-data-uploads/template?mode=cu-reg-roll|exam-form-fillup
 * Returns an empty Excel file with the correct header row.
 */
export const bulkDataUploadTemplateHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = templateModeSchema.safeParse(req.query.mode);
    if (!parsed.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "INVALID_MODE",
            { allowedModes: ["cu-reg-roll", "exam-form-fillup"] },
            'Query "mode" must be cu-reg-roll or exam-form-fillup',
          ),
        );
      return;
    }

    const headers =
      parsed.data === "cu-reg-roll"
        ? [...CU_REG_ROLL_EXCEL_COLUMNS]
        : [...EXAM_FORM_FILLUP_EXCEL_COLUMNS];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename =
      parsed.data === "cu-reg-roll"
        ? "bulk-upload-cu-reg-roll-template.xlsx"
        : "bulk-upload-exam-form-fillup-template.xlsx";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};
