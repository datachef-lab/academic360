import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  exportBookCirculationExcel,
  findBookCirculationPaginated,
  getBookCirculationMeta,
  getBookCirculationPreviewByUserId,
  issueBookCirculationFromExistingById,
  reissueBookCirculationById,
  returnBookCirculationById,
  upsertBookCirculationRowsForUser,
} from "@/features/library/services/book-circulation.service.js";
import { socketService } from "@/services/socketService.js";

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const actorUserId = (req: Request): number | null => {
  const u = req.user as { id?: number } | undefined;
  return typeof u?.id === "number" && !Number.isNaN(u.id) ? u.id : null;
};

const actorName = (req: Request): string => {
  const u = req.user as { name?: string | null } | undefined;
  return u?.name?.trim() || "Someone";
};

export const getBookCirculationListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit =
      Number.isNaN(limit) || limit < 1 ? 10 : Math.min(limit, 100);

    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const userType =
      typeof req.query.userType === "string" ? req.query.userType : undefined;
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const issueDate =
      typeof req.query.issueDate === "string" ? req.query.issueDate : undefined;

    const records = await findBookCirculationPaginated({
      page: safePage,
      limit: safeLimit,
      search,
      userType: userType as
        | "ADMIN"
        | "STUDENT"
        | "FACULTY"
        | "STAFF"
        | "PARENTS"
        | undefined,
      status: status as
        | "ISSUED"
        | "OVERDUE"
        | "REISSUED"
        | "RETURNED"
        | undefined,
      issueDate,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          records,
          "Book circulation fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getBookCirculationPreviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = parseId(req.params.userId);
    if (!userId) {
      res.status(400).json(new ApiError(400, "Valid userId is required"));
      return;
    }
    const payload = await getBookCirculationPreviewByUserId(userId);
    if (!payload) {
      res.status(404).json(new ApiError(404, "User not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
          "Book circulation preview fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const performBookCirculationActionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid id is required"));
      return;
    }
    const action =
      typeof req.body?.action === "string" ? req.body.action.toUpperCase() : "";

    if (action === "RETURN") {
      await returnBookCirculationById(id);
    } else if (action === "REISSUE") {
      await reissueBookCirculationById(id);
    } else if (action === "ISSUE") {
      await issueBookCirculationFromExistingById(id);
    } else {
      res.status(400).json(new ApiError(400, "Invalid action"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Book circulation action completed.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getBookCirculationMetaController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = await getBookCirculationMeta();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
          "Book circulation meta fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const downloadBookCirculationExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const userType =
      typeof req.query.userType === "string" ? req.query.userType : undefined;
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const issueDate =
      typeof req.query.issueDate === "string" ? req.query.issueDate : undefined;

    const file = await exportBookCirculationExcel({
      search,
      userType: userType as
        | "ADMIN"
        | "STUDENT"
        | "FACULTY"
        | "STAFF"
        | "PARENTS"
        | undefined,
      status: status as
        | "ISSUED"
        | "OVERDUE"
        | "REISSUED"
        | "RETURNED"
        | undefined,
      issueDate,
    });

    const filename = `book-circulation-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(file);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const upsertBookCirculationRowsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = parseId(req.params.userId);
    if (!userId) {
      res.status(400).json(new ApiError(400, "Valid userId is required"));
      return;
    }

    const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
    if (!rows) {
      res.status(400).json(new ApiError(400, "rows array is required"));
      return;
    }

    const actorId = actorUserId(req);
    await upsertBookCirculationRowsForUser(userId, rows, actorId);
    socketService.sendLibraryBookCirculationUpdate({
      actorName: actorName(req),
      actorUserId: actorId,
      userId,
      action: "UPSERTED",
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Book circulation rows saved successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
