import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createBook,
  deleteBook,
  exportBooksExcel,
  findBooksPaginated,
  getBookById,
  getBooksMeta,
  updateBook,
  type BookUpsertInput,
} from "@/features/library/services/book.service.js";
import {
  createUploadConfig,
  FileTypeConfigs,
  uploadToS3,
} from "@/services/s3.service.js";
import { socketService } from "@/services/socketService.js";

const bookActorName = (req: Request): string => {
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

const parseOptionalBool = (value: unknown): boolean | null => {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return null;
};

const bodyToUpsert = (body: Record<string, unknown>): BookUpsertInput => {
  const title = typeof body.title === "string" ? body.title : "";
  if (!title.trim()) {
    throw new ApiError(400, "Title is required.");
  }
  return {
    title,
    libraryDocumentTypeId: parseOptionalInt(body.libraryDocumentTypeId),
    subTitle: typeof body.subTitle === "string" ? body.subTitle : null,
    alternateTitle:
      typeof body.alternateTitle === "string" ? body.alternateTitle : null,
    subjectGroupId: parseOptionalInt(body.subjectGroupId),
    languageId: parseOptionalInt(body.languageId),
    isbn: typeof body.isbn === "string" ? body.isbn : null,
    issueDate: typeof body.issueDate === "string" ? body.issueDate : null,
    edition: typeof body.edition === "string" ? body.edition : null,
    editionYear: typeof body.editionYear === "string" ? body.editionYear : null,
    bookVolume: typeof body.bookVolume === "string" ? body.bookVolume : null,
    bookPart: typeof body.bookPart === "string" ? body.bookPart : null,
    seriesId: parseOptionalInt(body.seriesId),
    publisherId: parseOptionalInt(body.publisherId),
    publishedYear:
      typeof body.publishedYear === "string" ? body.publishedYear : null,
    keywords: typeof body.keywords === "string" ? body.keywords : null,
    remarks: typeof body.remarks === "string" ? body.remarks : null,
    callNumber: typeof body.callNumber === "string" ? body.callNumber : null,
    journalId: parseOptionalInt(body.journalId),
    issueNumber: typeof body.issueNumber === "string" ? body.issueNumber : null,
    isUniqueAccess: parseOptionalBool(body.isUniqueAccess),
    enclosureId: parseOptionalInt(body.enclosureId),
    notes: typeof body.notes === "string" ? body.notes : null,
    frequency: parseOptionalInt(body.frequency),
    referenceNumber:
      typeof body.referenceNumber === "string" ? body.referenceNumber : null,
    frontCover: typeof body.frontCover === "string" ? body.frontCover : null,
    backCover: typeof body.backCover === "string" ? body.backCover : null,
  };
};

const actorUserId = (req: Request): number | null => {
  const u = req.user as { id?: number } | undefined;
  return typeof u?.id === "number" && !Number.isNaN(u.id) ? u.id : null;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024,
  },
});

export const uploadBookCoverMiddleware = upload.fields([
  { name: "frontCover", maxCount: 1 },
  { name: "backCover", maxCount: 1 },
]);

const getUploadFile = (
  req: Request,
  key: "frontCover" | "backCover",
): Express.Multer.File | undefined => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  return files?.[key]?.[0];
};

const maybeUploadBookCovers = async (
  req: Request,
  input: BookUpsertInput,
  existing?: { frontCover: string | null; backCover: string | null } | null,
) => {
  const frontFile = getUploadFile(req, "frontCover");
  const backFile = getUploadFile(req, "backCover");

  if (frontFile) {
    const uploaded = await uploadToS3(
      frontFile,
      createUploadConfig("library/books/front-covers", {
        allowedMimeTypes: FileTypeConfigs.IMAGES,
        maxFileSizeMB: 20,
        makePublic: true,
      }),
    );
    input.frontCover = uploaded.url;
  } else if (existing) {
    input.frontCover = existing.frontCover;
  }

  if (backFile) {
    const uploaded = await uploadToS3(
      backFile,
      createUploadConfig("library/books/back-covers", {
        allowedMimeTypes: FileTypeConfigs.IMAGES,
        maxFileSizeMB: 20,
        makePublic: true,
      }),
    );
    input.backCover = uploaded.url;
  } else if (existing) {
    input.backCover = existing.backCover;
  }
};

export const getBooksMetaController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const meta = await getBooksMeta();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", meta, "Book form options fetched."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const downloadBookExcelController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const buffer = await exportBooksExcel({
      search,
      publisherId: parseQueryInt(req.query, "publisherId"),
      languageId: parseQueryInt(req.query, "languageId"),
      subjectGroupId: parseQueryInt(req.query, "subjectGroupId"),
      seriesId: parseQueryInt(req.query, "seriesId"),
      libraryDocumentTypeId: parseQueryInt(req.query, "libraryDocumentTypeId"),
      journalId: parseQueryInt(req.query, "journalId"),
      enclosureId: parseQueryInt(req.query, "enclosureId"),
    });

    const filename = `library-books-${new Date().toISOString().slice(0, 10)}.xlsx`;
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

export const getBookListController = async (
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

    const result = await findBooksPaginated({
      page: safePage,
      limit: safeLimit,
      search,
      publisherId: parseQueryInt(req.query, "publisherId"),
      languageId: parseQueryInt(req.query, "languageId"),
      subjectGroupId: parseQueryInt(req.query, "subjectGroupId"),
      seriesId: parseQueryInt(req.query, "seriesId"),
      libraryDocumentTypeId: parseQueryInt(req.query, "libraryDocumentTypeId"),
      journalId: parseQueryInt(req.query, "journalId"),
      enclosureId: parseQueryInt(req.query, "enclosureId"),
    });

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", result, "Books fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getBookByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid book id.");
    }
    const row = await getBookById(id);
    if (!row) {
      throw new ApiError(404, "Book not found.");
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Book fetched successfully."));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createBookController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    await maybeUploadBookCovers(req, input, null);
    const id = await createBook(input, actorUserId(req));
    const title = input.title.trim() || "Untitled book";
    socketService.sendLibraryBookUpdate({
      action: "CREATED",
      actorName: bookActorName(req),
      bookId: id,
      bookTitle: title,
      meta: { bookId: id },
    });
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", { id }, "Book created successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateBookController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid book id.");
    }
    const existing = await getBookById(id);
    if (!existing) {
      throw new ApiError(404, "Book not found.");
    }
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    await maybeUploadBookCovers(req, input, existing);
    await updateBook(id, input, actorUserId(req));
    socketService.sendLibraryBookUpdate({
      action: "UPDATED",
      actorName: bookActorName(req),
      bookId: id,
      bookTitle: input.title.trim() || existing.title,
      meta: { bookId: id },
    });
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Book updated successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteBookController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new ApiError(400, "Invalid book id.");
    }
    const existing = await getBookById(id);
    if (!existing) {
      throw new ApiError(404, "Book not found.");
    }
    const title = existing.title.trim() || "Untitled book";
    await deleteBook(id);
    socketService.sendLibraryBookUpdate({
      action: "DELETED",
      actorName: bookActorName(req),
      bookId: id,
      bookTitle: title,
      meta: { bookId: id },
    });
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Book deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
