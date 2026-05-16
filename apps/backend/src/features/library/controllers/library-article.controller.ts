import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createLibraryArticle,
  deleteLibraryArticle,
  findLibraryArticlesPaginated,
  getLibraryArticleById,
  updateLibraryArticle,
  type LibraryArticleUpsertInput,
} from "@/features/library/services/library-article.service.js";
import { socketService } from "@/services/socketService.js";

const articleActorName = (req: Request): string => {
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

const parseOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return undefined;
};

const bodyToUpsert = (
  body: Record<string, unknown>,
): LibraryArticleUpsertInput => ({
  name: typeof body.name === "string" ? body.name : "",
  code: typeof body.code === "string" ? body.code : null,
  isDocumentTypeExist: parseOptionalBoolean(body.isDocumentTypeExist) === true,
  isUniqueAccessNumber:
    parseOptionalBoolean(body.isUniqueAccessNumber) === true,
  isJournal: parseOptionalBoolean(body.isJournal) === true,
  isAuthor: parseOptionalBoolean(body.isAuthor) === true,
  isImprint: parseOptionalBoolean(body.isImprint) === true,
  isCopyDetail: parseOptionalBoolean(body.isCopyDetail) === true,
  isKeyword: parseOptionalBoolean(body.isKeyword) === true,
  isRemarks: parseOptionalBoolean(body.isRemarks) === true,
  isCallNumber: parseOptionalBoolean(body.isCallNumber) === true,
  isEnclosure: parseOptionalBoolean(body.isEnclosure) === true,
  isVoucher: parseOptionalBoolean(body.isVoucher) === true,
  isAnalytical: parseOptionalBoolean(body.isAnalytical) === true,
  isCallNumberAuto: parseOptionalBoolean(body.isCallNumberAuto) === true,
  isCallNumberCompulsory:
    parseOptionalBoolean(body.isCallNumberCompulsory) === true,
  isPublisher: parseOptionalBoolean(body.isPublisher) === true,
  isNote: parseOptionalBoolean(body.isNote) === true,
});

export const getLibraryArticleListController = async (
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

    const result = await findLibraryArticlesPaginated({
      page: safePage,
      limit: safeLimit,
      search,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Library articles fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getLibraryArticleByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid library article id.");
    }
    const row = await getLibraryArticleById(id);
    if (!row) {
      throw new ApiError(404, "Library article not found.");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          row,
          "Library article fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createLibraryArticleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    const id = await createLibraryArticle(input);
    socketService.sendLibraryArticleUpdate({
      action: "CREATED",
      actorName: articleActorName(req),
      articleId: id,
      articleName: input.name.trim(),
      meta: { articleId: id },
    });
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          { id },
          "Library article created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateLibraryArticleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid library article id.");
    }

    const existing = await getLibraryArticleById(id);
    if (!existing) {
      throw new ApiError(404, "Library article not found.");
    }

    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) {
      throw new ApiError(400, "Name is required.");
    }

    await updateLibraryArticle(id, input);
    socketService.sendLibraryArticleUpdate({
      action: "UPDATED",
      actorName: articleActorName(req),
      articleId: id,
      articleName: input.name.trim(),
      meta: { articleId: id },
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Library article updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteLibraryArticleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid library article id.");
    }

    const existing = await getLibraryArticleById(id);
    if (!existing) {
      throw new ApiError(404, "Library article not found.");
    }

    const name = existing.name;
    await deleteLibraryArticle(id);
    socketService.sendLibraryArticleUpdate({
      action: "DELETED",
      actorName: articleActorName(req),
      articleId: id,
      articleName: name,
      meta: { articleId: id },
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "Library article deleted successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
