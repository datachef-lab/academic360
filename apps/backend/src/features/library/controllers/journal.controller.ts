import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createJournal,
  deleteJournal,
  exportJournalsExcel,
  findJournalsPaginated,
  getJournalById,
  getJournalMeta,
  listBooksLinkedToJournal,
  updateJournal,
  type JournalUpsertInput,
} from "@/features/library/services/journal.service.js";
import { socketService } from "@/services/socketService.js";

const journalActorName = (req: Request): string => {
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

const parseOptionalInt = (value: unknown): number | null => {
  if (value === "" || value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
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

const bodyToUpsert = (body: Record<string, unknown>): JournalUpsertInput => {
  const title = typeof body.title === "string" ? body.title : "";
  return {
    title,
    type: parseOptionalInt(body.type),
    subjectGroupId: parseOptionalInt(body.subjectGroupId),
    entryModeId: parseOptionalInt(body.entryModeId),
    publisherId: parseOptionalInt(body.publisherId),
    languageId: parseOptionalInt(body.languageId),
    bindingId: parseOptionalInt(body.bindingId),
    periodId: parseOptionalInt(body.periodId),
    issnNumber: typeof body.issnNumber === "string" ? body.issnNumber : null,
    sizeInCM: typeof body.sizeInCM === "string" ? body.sizeInCM : null,
  };
};

export const getJournalListController = async (
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

    const result = await findJournalsPaginated({
      page: safePage,
      limit: safeLimit,
      search,
      subjectGroupId: parseQueryInt(req.query, "subjectGroupId"),
      entryModeId: parseQueryInt(req.query, "entryModeId"),
      languageId: parseQueryInt(req.query, "languageId"),
      bindingId: parseQueryInt(req.query, "bindingId"),
      periodId: parseQueryInt(req.query, "periodId"),
      publisherId: parseQueryInt(req.query, "publisherId"),
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Journals fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const downloadJournalExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const buffer = await exportJournalsExcel({
      search,
      subjectGroupId: parseQueryInt(req.query, "subjectGroupId"),
      entryModeId: parseQueryInt(req.query, "entryModeId"),
      languageId: parseQueryInt(req.query, "languageId"),
      bindingId: parseQueryInt(req.query, "bindingId"),
      periodId: parseQueryInt(req.query, "periodId"),
      publisherId: parseQueryInt(req.query, "publisherId"),
    });

    const filename = `library-journals-${new Date().toISOString().slice(0, 10)}.xlsx`;
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

export const getJournalMetaController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const meta = await getJournalMeta();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", meta, "Journal form options fetched."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getJournalLinkedBooksController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid journal id.");
    }
    const existing = await getJournalById(id);
    if (!existing) {
      throw new ApiError(404, "Journal not found.");
    }
    const books = await listBooksLinkedToJournal(id);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          { books },
          "Linked books fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getJournalByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid journal id.");
    }
    const row = await getJournalById(id);
    if (!row) {
      throw new ApiError(404, "Journal not found.");
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Journal fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createJournalController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.title.trim()) {
      throw new ApiError(400, "Title is required.");
    }
    const id = await createJournal(input);
    socketService.sendLibraryJournalUpdate({
      action: "CREATED",
      actorName: journalActorName(req),
      journalId: id,
      journalTitle: input.title.trim(),
      meta: { journalId: id },
    });
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          { id },
          "Journal created successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateJournalController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid journal id.");
    }
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.title.trim()) {
      throw new ApiError(400, "Title is required.");
    }
    const existing = await getJournalById(id);
    if (!existing) {
      throw new ApiError(404, "Journal not found.");
    }
    await updateJournal(id, input);
    socketService.sendLibraryJournalUpdate({
      action: "UPDATED",
      actorName: journalActorName(req),
      journalId: id,
      journalTitle: input.title.trim(),
      meta: { journalId: id },
    });
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Journal updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteJournalController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid journal id.");
    }
    const existing = await getJournalById(id);
    if (!existing) {
      throw new ApiError(404, "Journal not found.");
    }
    const title = existing.title;
    await deleteJournal(id);
    socketService.sendLibraryJournalUpdate({
      action: "DELETED",
      actorName: journalActorName(req),
      journalId: id,
      journalTitle: title,
      meta: { journalId: id },
    });
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Journal deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
