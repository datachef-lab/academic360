import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createCopyDetails,
  exportCopyDetailsExcel,
  findCopyDetailsPaginated,
  getBookTitleById,
  getCopyDetailsById,
  getCopyDetailsMeta,
  updateCopyDetails,
  type CopyDetailsUpsertInput,
} from "@/features/library/services/copy-details.service.js";
import { socketService } from "@/services/socketService.js";

const copyDetailsActorName = (req: Request): string => {
  const u = req.user as { name?: string | null } | undefined;
  const n = typeof u?.name === "string" ? u.name.trim() : "";
  return n || "Someone";
};

const parseId = (value?: string | string[]): number | null => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) return null;
  return parsed;
};

const parseQueryInt = (
  q: Request["query"],
  key: string,
): number | undefined => {
  const raw = q[key];
  const s =
    typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  if (s === undefined || s === "") return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
};

const parseOptionalInt = (value: unknown): number | null => {
  if (value === "" || value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const bodyToUpsert = (
  body: Record<string, unknown>,
): CopyDetailsUpsertInput => {
  const bookId = Number(body.bookId);
  if (!body.bookId || Number.isNaN(bookId)) {
    throw new ApiError(400, "Valid bookId is required.");
  }
  return {
    bookId,
    publishedYear:
      typeof body.publishedYear === "string" ? body.publishedYear : null,
    accessNumber:
      typeof body.accessNumber === "string" ? body.accessNumber : null,
    oldAccessNumber:
      typeof body.oldAccessNumber === "string" ? body.oldAccessNumber : null,
    type: typeof body.type === "string" ? body.type : null,
    issueType: typeof body.issueType === "string" ? body.issueType : null,
    statusId: parseOptionalInt(body.statusId),
    enntryModeId: parseOptionalInt(body.enntryModeId),
    rackId: parseOptionalInt(body.rackId),
    shelfId: parseOptionalInt(body.shelfId),
    voucherNumber:
      typeof body.voucherNumber === "string" ? body.voucherNumber : null,
    enclosureId: parseOptionalInt(body.enclosureId),
    numberOfEnclosures: parseOptionalInt(body.numberOfEnclosures),
    numberOfPages: parseOptionalInt(body.numberOfPages),
    priceInINR: typeof body.priceInINR === "string" ? body.priceInINR : null,
    bindingTypeId: parseOptionalInt(body.bindingTypeId),
    isbn: typeof body.isbn === "string" ? body.isbn : null,
    remarks: typeof body.remarks === "string" ? body.remarks : null,
  };
};

const actorUserId = (req: Request): number | null => {
  const u = req.user as { id?: number } | undefined;
  return typeof u?.id === "number" && !Number.isNaN(u.id) ? u.id : null;
};

export const getCopyDetailsMetaController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const meta = await getCopyDetailsMeta();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          meta,
          "Copy details form options fetched.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const downloadCopyDetailsExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const buffer = await exportCopyDetailsExcel({
      search,
      statusId: parseQueryInt(req.query, "statusId"),
      entryModeId: parseQueryInt(req.query, "entryModeId"),
      rackId: parseQueryInt(req.query, "rackId"),
      shelfId: parseQueryInt(req.query, "shelfId"),
      bindingTypeId: parseQueryInt(req.query, "bindingTypeId"),
      enclosureId: parseQueryInt(req.query, "enclosureId"),
      bookId: parseQueryInt(req.query, "bookId"),
    });

    const filename = `library-copy-details-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.status(200).send(buffer);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getCopyDetailsListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safeLimit =
      Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 100);
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await findCopyDetailsPaginated({
      page: safePage,
      limit: safeLimit,
      search,
      statusId: parseQueryInt(req.query, "statusId"),
      entryModeId: parseQueryInt(req.query, "entryModeId"),
      rackId: parseQueryInt(req.query, "rackId"),
      shelfId: parseQueryInt(req.query, "shelfId"),
      bindingTypeId: parseQueryInt(req.query, "bindingTypeId"),
      enclosureId: parseQueryInt(req.query, "enclosureId"),
      bookId: parseQueryInt(req.query, "bookId"),
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Copy details fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getCopyDetailsByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid copy details id.");
    }
    const row = await getCopyDetailsById(id);
    if (!row) {
      throw new ApiError(404, "Copy details not found.");
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Copy details fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createCopyDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    const id = await createCopyDetails(input, actorUserId(req));
    const bookTitle =
      (await getBookTitleById(input.bookId))?.trim() || `Book #${input.bookId}`;
    socketService.sendLibraryCopyDetailsUpdate({
      action: "CREATED",
      actorName: copyDetailsActorName(req),
      copyDetailsId: id,
      bookTitle,
      meta: { copyDetailsId: id, bookId: input.bookId },
    });
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          { id },
          "Copy details created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateCopyDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid copy details id.");
    }
    const existing = await getCopyDetailsById(id);
    if (!existing) {
      throw new ApiError(404, "Copy details not found.");
    }
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    await updateCopyDetails(id, input, actorUserId(req));
    const bookTitle =
      (await getBookTitleById(input.bookId))?.trim() || `Book #${input.bookId}`;
    socketService.sendLibraryCopyDetailsUpdate({
      action: "UPDATED",
      actorName: copyDetailsActorName(req),
      copyDetailsId: id,
      bookTitle,
      meta: { copyDetailsId: id, bookId: input.bookId },
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Copy details updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
