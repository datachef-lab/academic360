import ExcelJS from "exceljs";
import { db } from "@/db/index.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import { applyStandardExcelReportTableStyling } from "@/utils/excel-report-styling.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { enclosureModel } from "@repo/db/schemas/models/library/enclosure.model.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { libraryArticleModel } from "@repo/db/schemas/models/library/library-article.model.js";
import { libraryDocumentTypeModel } from "@repo/db/schemas/models/library/library-document-type.model.js";
import { libraryPeriodModel } from "@repo/db/schemas/models/library/library-period.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { seriesModel } from "@repo/db/schemas/models/library/series.model.js";
import { subjectGroupingMainModel } from "@repo/db/schemas/models/course-design/subject-grouping-main.model.js";
import { languageMediumModel } from "@repo/db/schemas/models/resources/languageMedium.model.js";

export type BookListFilters = {
  page: number;
  limit: number;
  search?: string;
  publisherId?: number;
  languageId?: number;
  subjectGroupId?: number;
  seriesId?: number;
  libraryDocumentTypeId?: number;
  journalId?: number;
  enclosureId?: number;
};

export type BookExportFilters = Omit<BookListFilters, "page" | "limit">;

export type BookListRow = {
  id: number;
  title: string;
  subTitle: string | null;
  frontCover: string | null;
  isbn: string | null;
  edition: string | null;
  publishedYear: string | null;
  publisherName: string | null;
  languageName: string | null;
  subjectGroupName: string | null;
  seriesName: string | null;
  documentTypeName: string | null;
  libraryArticleName: string | null;
  journalTitle: string | null;
  periodName: string | null;
  enclosureName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BookListResult = {
  rows: BookListRow[];
  total: number;
  page: number;
  limit: number;
};

export type BookDetail = {
  id: number;
  libraryDocumentTypeId: number | null;
  title: string;
  subTitle: string | null;
  alternateTitle: string | null;
  subjectGroupId: number | null;
  languageId: number | null;
  isbn: string | null;
  issueDate: string | null;
  edition: string | null;
  editionYear: string | null;
  bookVolume: string | null;
  bookPart: string | null;
  seriesId: number | null;
  publisherId: number | null;
  publishedYear: string | null;
  keywords: string | null;
  remarks: string | null;
  callNumber: string | null;
  journalId: number | null;
  issueNumber: string | null;
  isUniqueAccess: boolean;
  enclosureId: number | null;
  notes: string | null;
  frequency: number | null;
  referenceNumber: string | null;
  frontCover: string | null;
  backCover: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BookUpsertInput = {
  title: string;
  libraryDocumentTypeId?: number | null;
  subTitle?: string | null;
  alternateTitle?: string | null;
  subjectGroupId?: number | null;
  languageId?: number | null;
  isbn?: string | null;
  issueDate?: string | null;
  edition?: string | null;
  editionYear?: string | null;
  bookVolume?: string | null;
  bookPart?: string | null;
  seriesId?: number | null;
  publisherId?: number | null;
  publishedYear?: string | null;
  keywords?: string | null;
  remarks?: string | null;
  callNumber?: string | null;
  journalId?: number | null;
  issueNumber?: string | null;
  isUniqueAccess?: boolean | null;
  enclosureId?: number | null;
  notes?: string | null;
  frequency?: number | null;
  referenceNumber?: string | null;
  frontCover?: string | null;
  backCover?: string | null;
};

export type BookMetaResult = {
  libraryDocumentTypes: Array<{
    id: number;
    name: string;
    libraryArticleName: string | null;
  }>;
  publishers: Array<{ id: number; name: string | null }>;
  languages: Array<{ id: number; name: string | null }>;
  subjectGroups: Array<{ id: number; name: string }>;
  series: Array<{ id: number; name: string }>;
  journals: Array<{ id: number; title: string }>;
  enclosures: Array<{ id: number; name: string }>;
  periods: Array<{ id: number; name: string | null }>;
};

const buildListWhere = (
  filters: Omit<BookListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    parts.push(
      or(
        ilike(bookModel.title, term),
        ilike(bookModel.subTitle, term),
        ilike(bookModel.alternateTitle, term),
        ilike(bookModel.isbn, term),
        ilike(bookModel.keywords, term),
        ilike(bookModel.remarks, term),
        ilike(bookModel.callNumber, term),
        ilike(bookModel.edition, term),
        ilike(bookModel.issueNumber, term),
        ilike(publisherModel.name, term),
        ilike(journalModel.title, term),
      )!,
    );
  }
  if (filters.publisherId != null && !Number.isNaN(filters.publisherId)) {
    parts.push(eq(bookModel.publisherId, filters.publisherId));
  }
  if (filters.languageId != null && !Number.isNaN(filters.languageId)) {
    parts.push(eq(bookModel.languageId, filters.languageId));
  }
  if (filters.subjectGroupId != null && !Number.isNaN(filters.subjectGroupId)) {
    parts.push(eq(bookModel.subjectGroupId, filters.subjectGroupId));
  }
  if (filters.seriesId != null && !Number.isNaN(filters.seriesId)) {
    parts.push(eq(bookModel.seriesId, filters.seriesId));
  }
  if (
    filters.libraryDocumentTypeId != null &&
    !Number.isNaN(filters.libraryDocumentTypeId)
  ) {
    parts.push(
      eq(bookModel.libraryDocumentTypeId, filters.libraryDocumentTypeId),
    );
  }
  if (filters.journalId != null && !Number.isNaN(filters.journalId)) {
    parts.push(eq(bookModel.journalId, filters.journalId));
  }
  if (filters.enclosureId != null && !Number.isNaN(filters.enclosureId)) {
    parts.push(eq(bookModel.enclosureId, filters.enclosureId));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0]! : and(...parts)!;
};

const listSelectShape = {
  id: bookModel.id,
  title: bookModel.title,
  subTitle: bookModel.subTitle,
  frontCover: bookModel.frontCover,
  isbn: bookModel.isbn,
  edition: bookModel.edition,
  publishedYear: bookModel.publishedYear,
  publisherName: publisherModel.name,
  languageName: languageMediumModel.name,
  subjectGroupName: subjectGroupingMainModel.name,
  seriesName: seriesModel.name,
  documentTypeName: libraryDocumentTypeModel.name,
  libraryArticleName: libraryArticleModel.name,
  journalTitle: journalModel.title,
  periodName: libraryPeriodModel.name,
  enclosureName: enclosureModel.name,
  createdAt: bookModel.createdAt,
  updatedAt: bookModel.updatedAt,
};

export async function findBooksPaginated(
  filters: BookListFilters,
): Promise<BookListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await db
    .select({ total: count() })
    .from(bookModel)
    .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id))
    .leftJoin(
      languageMediumModel,
      eq(bookModel.languageId, languageMediumModel.id),
    )
    .leftJoin(
      subjectGroupingMainModel,
      eq(bookModel.subjectGroupId, subjectGroupingMainModel.id),
    )
    .leftJoin(seriesModel, eq(bookModel.seriesId, seriesModel.id))
    .leftJoin(
      libraryDocumentTypeModel,
      eq(bookModel.libraryDocumentTypeId, libraryDocumentTypeModel.id),
    )
    .leftJoin(
      libraryArticleModel,
      eq(libraryDocumentTypeModel.libraryArticleId, libraryArticleModel.id),
    )
    .leftJoin(journalModel, eq(bookModel.journalId, journalModel.id))
    .leftJoin(
      libraryPeriodModel,
      eq(bookModel.frequency, libraryPeriodModel.id),
    )
    .leftJoin(enclosureModel, eq(bookModel.enclosureId, enclosureModel.id))
    .where(whereClause);

  const rows = await db
    .select(listSelectShape)
    .from(bookModel)
    .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id))
    .leftJoin(
      languageMediumModel,
      eq(bookModel.languageId, languageMediumModel.id),
    )
    .leftJoin(
      subjectGroupingMainModel,
      eq(bookModel.subjectGroupId, subjectGroupingMainModel.id),
    )
    .leftJoin(seriesModel, eq(bookModel.seriesId, seriesModel.id))
    .leftJoin(
      libraryDocumentTypeModel,
      eq(bookModel.libraryDocumentTypeId, libraryDocumentTypeModel.id),
    )
    .leftJoin(
      libraryArticleModel,
      eq(libraryDocumentTypeModel.libraryArticleId, libraryArticleModel.id),
    )
    .leftJoin(journalModel, eq(bookModel.journalId, journalModel.id))
    .leftJoin(
      libraryPeriodModel,
      eq(bookModel.frequency, libraryPeriodModel.id),
    )
    .leftJoin(enclosureModel, eq(bookModel.enclosureId, enclosureModel.id))
    .where(whereClause)
    .orderBy(desc(bookModel.id))
    .limit(limit)
    .offset(offset);

  return { rows, total, page, limit };
}

const formatExcelDateTime = (value: Date | string | null) => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

export async function exportBooksExcel(
  filters: BookExportFilters,
): Promise<Buffer> {
  const whereClause = buildListWhere(filters);

  const rows = await db
    .select({
      id: bookModel.id,
      title: bookModel.title,
      subTitle: bookModel.subTitle,
      alternateTitle: bookModel.alternateTitle,
      isbn: bookModel.isbn,
      edition: bookModel.edition,
      publishedYear: bookModel.publishedYear,
      publisherName: publisherModel.name,
      languageName: languageMediumModel.name,
      subjectGroupName: subjectGroupingMainModel.name,
      seriesName: seriesModel.name,
      documentTypeName: libraryDocumentTypeModel.name,
      libraryArticleName: libraryArticleModel.name,
      journalTitle: journalModel.title,
      periodName: libraryPeriodModel.name,
      enclosureName: enclosureModel.name,
      callNumber: bookModel.callNumber,
      issueNumber: bookModel.issueNumber,
      isUniqueAccess: bookModel.isUniqueAccess,
      createdAt: bookModel.createdAt,
      updatedAt: bookModel.updatedAt,
    })
    .from(bookModel)
    .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id))
    .leftJoin(
      languageMediumModel,
      eq(bookModel.languageId, languageMediumModel.id),
    )
    .leftJoin(
      subjectGroupingMainModel,
      eq(bookModel.subjectGroupId, subjectGroupingMainModel.id),
    )
    .leftJoin(seriesModel, eq(bookModel.seriesId, seriesModel.id))
    .leftJoin(
      libraryDocumentTypeModel,
      eq(bookModel.libraryDocumentTypeId, libraryDocumentTypeModel.id),
    )
    .leftJoin(
      libraryArticleModel,
      eq(libraryDocumentTypeModel.libraryArticleId, libraryArticleModel.id),
    )
    .leftJoin(journalModel, eq(bookModel.journalId, journalModel.id))
    .leftJoin(
      libraryPeriodModel,
      eq(bookModel.frequency, libraryPeriodModel.id),
    )
    .leftJoin(enclosureModel, eq(bookModel.enclosureId, enclosureModel.id))
    .where(whereClause)
    .orderBy(desc(bookModel.id))
    .limit(100_000);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Books");

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Title", key: "title", width: 42 },
    { header: "Subtitle", key: "subTitle", width: 32 },
    { header: "Alternate title", key: "alternateTitle", width: 28 },
    { header: "ISBN", key: "isbn", width: 18 },
    { header: "Edition", key: "edition", width: 14 },
    { header: "Published year", key: "publishedYear", width: 14 },
    { header: "Publisher", key: "publisher", width: 26 },
    { header: "Language", key: "language", width: 18 },
    { header: "Subject group", key: "subjectGroup", width: 24 },
    { header: "Series", key: "series", width: 22 },
    { header: "Document type", key: "docType", width: 22 },
    { header: "Library article", key: "docTypeArticle", width: 22 },
    { header: "Journal", key: "journal", width: 28 },
    { header: "Period / frequency", key: "period", width: 22 },
    { header: "Enclosure", key: "enclosure", width: 20 },
    { header: "Call number", key: "callNumber", width: 16 },
    { header: "Issue number", key: "issueNumber", width: 14 },
    { header: "Unique access", key: "uniqueAccess", width: 14 },
    { header: "Created at", key: "createdAt", width: 22 },
    { header: "Updated at", key: "updatedAt", width: 22 },
  ];

  for (const row of rows) {
    sheet.addRow({
      id: row.id,
      title: row.title ?? "",
      subTitle: row.subTitle ?? "",
      alternateTitle: row.alternateTitle ?? "",
      isbn: row.isbn ?? "",
      edition: row.edition ?? "",
      publishedYear: row.publishedYear ?? "",
      publisher: row.publisherName ?? "",
      language: row.languageName ?? "",
      subjectGroup: row.subjectGroupName ?? "",
      series: row.seriesName ?? "",
      docType: row.documentTypeName ?? "",
      docTypeArticle: row.libraryArticleName ?? "",
      journal: row.journalTitle ?? "",
      period: row.periodName ?? "",
      enclosure: row.enclosureName ?? "",
      callNumber: row.callNumber ?? "",
      issueNumber: row.issueNumber ?? "",
      uniqueAccess: row.isUniqueAccess ? "Yes" : "No",
      createdAt: formatExcelDateTime(row.createdAt),
      updatedAt: formatExcelDateTime(row.updatedAt),
    });
  }

  applyStandardExcelReportTableStyling(sheet);

  const result = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(result) ? result : Buffer.from(result);
}

async function countCopyDetailsForBook(bookId: number): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(copyDetailsModel)
    .where(eq(copyDetailsModel.bookId, bookId));
  return Number(n) || 0;
}

export async function deleteBook(id: number): Promise<void> {
  const [b] = await db
    .select({ id: bookModel.id })
    .from(bookModel)
    .where(eq(bookModel.id, id))
    .limit(1);
  if (!b) {
    throw new ApiError(404, "Book not found.");
  }
  const copyCount = await countCopyDetailsForBook(id);
  if (copyCount > 0) {
    throw new ApiError(
      409,
      `This book cannot be deleted because it has ${copyCount} linked copy detail record(s). Remove or reassign copies first.`,
    );
  }
  await db.delete(bookModel).where(eq(bookModel.id, id));
}

function parseIssueDate(s: string | null | undefined): string | null {
  if (!s?.trim()) return null;
  const d = new Date(s.trim());
  return Number.isNaN(d.getTime()) ? null : s.trim();
}

function upsertValues(input: BookUpsertInput) {
  return {
    title: input.title.trim(),
    libraryDocumentTypeId: input.libraryDocumentTypeId ?? null,
    subTitle: input.subTitle?.trim() || null,
    alternateTitle: input.alternateTitle?.trim() || null,
    subjectGroupId: input.subjectGroupId ?? null,
    languageId: input.languageId ?? null,
    isbn: input.isbn?.trim() || null,
    issueDate: parseIssueDate(input.issueDate ?? null),
    edition: input.edition?.trim() || null,
    editionYear: input.editionYear?.trim() || null,
    bookVolume: input.bookVolume?.trim() || null,
    bookPart: input.bookPart?.trim() || null,
    seriesId: input.seriesId ?? null,
    publisherId: input.publisherId ?? null,
    publishedYear: input.publishedYear?.trim() || null,
    keywords: input.keywords?.trim() || null,
    remarks: input.remarks?.trim() || null,
    callNumber: input.callNumber?.trim() || null,
    journalId: input.journalId ?? null,
    issueNumber: input.issueNumber?.trim() || null,
    isUniqueAccess: input.isUniqueAccess === true,
    enclosureId: input.enclosureId ?? null,
    notes: input.notes?.trim() || null,
    frequency: input.frequency ?? null,
    referenceNumber: input.referenceNumber?.trim() || null,
    frontCover: input.frontCover?.trim() || null,
    backCover: input.backCover?.trim() || null,
  };
}

export async function createBook(
  input: BookUpsertInput,
  createdById: number | null,
): Promise<number> {
  const [inserted] = await db
    .insert(bookModel)
    .values({
      ...upsertValues(input),
      createdById: createdById ?? null,
    })
    .returning({ id: bookModel.id });
  return inserted.id;
}

export async function updateBook(
  id: number,
  input: BookUpsertInput,
  updatedById: number | null,
): Promise<void> {
  await db
    .update(bookModel)
    .set({
      ...upsertValues(input),
      updatedById: updatedById ?? null,
      updatedAt: new Date(),
    })
    .where(eq(bookModel.id, id));
}

export async function getBookById(id: number): Promise<BookDetail | null> {
  const [row] = await db
    .select({
      id: bookModel.id,
      libraryDocumentTypeId: bookModel.libraryDocumentTypeId,
      title: bookModel.title,
      subTitle: bookModel.subTitle,
      alternateTitle: bookModel.alternateTitle,
      subjectGroupId: bookModel.subjectGroupId,
      languageId: bookModel.languageId,
      isbn: bookModel.isbn,
      issueDate: bookModel.issueDate,
      edition: bookModel.edition,
      editionYear: bookModel.editionYear,
      bookVolume: bookModel.bookVolume,
      bookPart: bookModel.bookPart,
      seriesId: bookModel.seriesId,
      publisherId: bookModel.publisherId,
      publishedYear: bookModel.publishedYear,
      keywords: bookModel.keywords,
      remarks: bookModel.remarks,
      callNumber: bookModel.callNumber,
      journalId: bookModel.journalId,
      issueNumber: bookModel.issueNumber,
      isUniqueAccess: bookModel.isUniqueAccess,
      enclosureId: bookModel.enclosureId,
      notes: bookModel.notes,
      frequency: bookModel.frequency,
      referenceNumber: bookModel.referenceNumber,
      frontCover: bookModel.frontCover,
      backCover: bookModel.backCover,
      createdAt: bookModel.createdAt,
      updatedAt: bookModel.updatedAt,
    })
    .from(bookModel)
    .where(eq(bookModel.id, id))
    .limit(1);
  if (!row) return null;
  const { issueDate: issueDateRaw, ...rest } = row;
  const issueDate = issueDateRaw ? String(issueDateRaw).slice(0, 10) : null;
  return { ...rest, issueDate };
}

export async function getBooksMeta(): Promise<BookMetaResult> {
  const [
    libraryDocumentTypes,
    publishers,
    languages,
    subjectGroups,
    series,
    journals,
    enclosures,
    periods,
  ] = await Promise.all([
    db
      .select({
        id: libraryDocumentTypeModel.id,
        name: libraryDocumentTypeModel.name,
        libraryArticleName: libraryArticleModel.name,
      })
      .from(libraryDocumentTypeModel)
      .leftJoin(
        libraryArticleModel,
        eq(libraryDocumentTypeModel.libraryArticleId, libraryArticleModel.id),
      )
      .orderBy(desc(libraryDocumentTypeModel.id)),
    db
      .select({ id: publisherModel.id, name: publisherModel.name })
      .from(publisherModel)
      .orderBy(desc(publisherModel.id))
      .limit(500),
    db
      .select({ id: languageMediumModel.id, name: languageMediumModel.name })
      .from(languageMediumModel)
      .orderBy(desc(languageMediumModel.id)),
    db
      .select({
        id: subjectGroupingMainModel.id,
        name: subjectGroupingMainModel.name,
      })
      .from(subjectGroupingMainModel)
      .orderBy(desc(subjectGroupingMainModel.id))
      .limit(500),
    db
      .select({ id: seriesModel.id, name: seriesModel.name })
      .from(seriesModel)
      .orderBy(desc(seriesModel.id))
      .limit(300),
    db
      .select({ id: journalModel.id, title: journalModel.title })
      .from(journalModel)
      .orderBy(desc(journalModel.id))
      .limit(400),
    db
      .select({ id: enclosureModel.id, name: enclosureModel.name })
      .from(enclosureModel)
      .orderBy(desc(enclosureModel.id))
      .limit(300),
    db
      .select({ id: libraryPeriodModel.id, name: libraryPeriodModel.name })
      .from(libraryPeriodModel)
      .orderBy(desc(libraryPeriodModel.id)),
  ]);

  return {
    libraryDocumentTypes,
    publishers,
    languages,
    subjectGroups,
    series,
    journals,
    enclosures,
    periods,
  };
}
