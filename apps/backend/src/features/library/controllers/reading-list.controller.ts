import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createReadingList,
  createReadingListItem,
  deleteReadingList,
  deleteReadingListItem,
  findReadingListsPaginated,
  getReadingListById,
  listItemsForList,
  updateReadingList,
} from "@/features/library/services/reading-list.service.js";

const parseId = (v?: string | string[]): number | null => {
  const input = Array.isArray(v) ? v[0] : v;
  const n = Number(input);
  if (!input || Number.isNaN(n)) return null;
  return n;
};

const optId = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const listReadingLists = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const result = await findReadingListsPaginated({
      page: Number.isNaN(page) || page < 1 ? 1 : page,
      limit: Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 100),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      programCourseId: optId(req.query.programCourseId) ?? undefined,
      classId: optId(req.query.classId) ?? undefined,
      isPublished:
        req.query.isPublished === "true"
          ? true
          : req.query.isPublished === "false"
            ? false
            : undefined,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Reading lists fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getReadingList = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const row = await getReadingListById(id);
    if (!row) throw new ApiError(404, "Reading list not found.");
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Reading list fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

const bodyToUpsert = (b: Record<string, unknown>) => ({
  programCourseId: optId(b.programCourseId) ?? 0,
  classId: optId(b.classId),
  facultyUserId: optId(b.facultyUserId),
  title: typeof b.title === "string" ? b.title : "",
  description: typeof b.description === "string" ? b.description : null,
  isPublished: typeof b.isPublished === "boolean" ? b.isPublished : undefined,
});

export const createReadingListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = await createReadingList(
      bodyToUpsert(req.body as Record<string, unknown>),
    );
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Reading list created."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const updateReadingListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await updateReadingList(
      id,
      bodyToUpsert(req.body as Record<string, unknown>),
    );
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Reading list updated."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const deleteReadingListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await deleteReadingList(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Reading list deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const listItemsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.readingListId);
    if (!id) throw new ApiError(400, "Invalid reading list id.");
    const rows = await listItemsForList(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Items fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const createItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const readingListId = parseId(req.params.readingListId);
    if (!readingListId) throw new ApiError(400, "Invalid reading list id.");
    const b = req.body as Record<string, unknown>;
    const itemTypeRaw =
      typeof b.itemType === "string" ? b.itemType.toUpperCase() : "";
    if (!["BOOK", "JOURNAL", "EXTERNAL_URL"].includes(itemTypeRaw)) {
      throw new ApiError(
        400,
        "itemType must be BOOK | JOURNAL | EXTERNAL_URL.",
      );
    }
    const id = await createReadingListItem({
      readingListId,
      itemType: itemTypeRaw as "BOOK" | "JOURNAL" | "EXTERNAL_URL",
      bookId: optId(b.bookId),
      journalId: optId(b.journalId),
      externalUrl: typeof b.externalUrl === "string" ? b.externalUrl : null,
      externalTitle:
        typeof b.externalTitle === "string" ? b.externalTitle : null,
      notes: typeof b.notes === "string" ? b.notes : null,
      displayOrder: typeof b.displayOrder === "number" ? b.displayOrder : 0,
    });
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Item added."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const deleteItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await deleteReadingListItem(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Item removed."));
  } catch (e) {
    handleError(e, res, next);
  }
};
