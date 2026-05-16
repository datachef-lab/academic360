import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  ensureFeeReceiptChallanUrl,
  generateFeeReceiptByChallanNumber,
} from "../services/fee-student-mapping.service.js";
import { ApiError, handleError } from "@/utils";
import { ApiResponse } from "@/utils/ApiResonse";
import { buildFeeReceiptPdfContentDisposition } from "@/utils/fee-receipt-content-disposition.js";
import { sendNotFoundHtmlIfDocumentNavigation } from "@/utils/send-not-found-html-or-json.js";

const postBodySchema = z.object({
  feeStructureId: z.coerce.number().int().positive(),
  studentId: z.coerce.number().int().positive(),
});

export async function postFeeReceiptEnsureHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = postBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json(new ApiError(400, "feeStructureId and studentId are required"));
      return;
    }

    const { feeStructureId, studentId } = parsed.data;
    const result = await ensureFeeReceiptChallanUrl(feeStructureId, studentId);

    if (!result) {
      res
        .status(404)
        .json(
          new ApiError(
            404,
            "Fee mapping not found for the given fee structure and student",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(new ApiResponse(200, "OK", result, "Receipt URL ready"));
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getFeeReceiptPdfByChallanHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const challanNumber = String(req.query.challanNumber ?? "").trim();
    if (!challanNumber) {
      res.status(400).json(new ApiError(400, "challanNumber is required"));
      return;
    }

    const result = await generateFeeReceiptByChallanNumber(challanNumber);

    if (!result) {
      sendNotFoundHtmlIfDocumentNavigation(req, res, 404, () => {
        res
          .status(404)
          .json(new ApiError(404, "Fee receipt not found for this challan"));
      });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      buildFeeReceiptPdfContentDisposition({
        uid: result.uid ?? "",
        receiptName: result.receiptName ?? "",
        semester: result.semester ?? "",
        programCourse: result.programCourse ?? "",
        session: result.session ?? "",
      }),
    );

    res.send(result.pdfBuffer);
  } catch (error) {
    handleError(error, res, next);
  }
}
