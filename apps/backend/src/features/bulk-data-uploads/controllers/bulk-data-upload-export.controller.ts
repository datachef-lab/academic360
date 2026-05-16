import { Request, Response, NextFunction } from "express";
import XLSX from "xlsx";
import { z } from "zod";
import { fetchBulkExportRows } from "../services/export-records.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

const exportQuerySchema = z.object({
  mode: z.enum(["cu-reg-roll", "exam-form-fillup"]),
  affiliationId: z.coerce.number().int().positive(),
  regulationTypeId: z.coerce.number().int().positive(),
  academicYearId: z.coerce.number().int().positive(),
  classId: z.coerce.number().int().positive().optional(),
});

/**
 * GET /api/v1/bulk-data-uploads/export
 * Filtered Excel of existing promotions + student fields (and exam form fill-up when mode=exam-form-fillup).
 */
export const bulkDataUploadExportHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = exportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "INVALID_QUERY",
            parsed.error.flatten(),
            "affiliationId, regulationTypeId, academicYearId, and mode are required; classId is optional",
          ),
        );
      return;
    }

    const out = await fetchBulkExportRows(parsed.data);
    if (!out.ok) {
      res
        .status(400)
        .json(new ApiResponse(400, "EXPORT_NOT_AVAILABLE", null, out.message));
      return;
    }
    const { headers, rows } = out;

    const wb = XLSX.utils.book_new();
    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Records");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename =
      parsed.data.mode === "cu-reg-roll"
        ? "bulk-data-cu-reg-roll-records.xlsx"
        : "bulk-data-exam-form-fillup-records.xlsx";

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
