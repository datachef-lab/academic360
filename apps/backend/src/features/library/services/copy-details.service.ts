import ExcelJS from "exceljs";
import { db } from "@/db/index.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { applyStandardExcelReportTableStyling } from "@/utils/excel-report-styling.js";
import { bindingModel } from "@repo/db/schemas/models/library/binding.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { enclosureModel } from "@repo/db/schemas/models/library/enclosure.model.js";
import { entryModeModel } from "@repo/db/schemas/models/library/entry-mode.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { rackModel } from "@repo/db/schemas/models/library/rack.model.js";
import { shelfModel } from "@repo/db/schemas/models/library/shelf.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";

export type CopyDetailsListFilters = {
  page: number;
  limit: number;
  search?: string;
  statusId?: number;
  entryModeId?: number;
  rackId?: number;
  shelfId?: number;
  bindingTypeId?: number;
  enclosureId?: number;
  bookId?: number;
};

export type CopyDetailsExportFilters = Omit<
  CopyDetailsListFilters,
  "page" | "limit"
>;

export type CopyDetailsListRow = {
  id: number;
  bookId: number;
  bookTitle: string;
  publisherName: string | null;
  accessNumber: string | null;
  oldAccessNumber: string | null;
  isbn: string | null;
  publishedYear: string | null;
  statusName: string | null;
  entryModeName: string | null;
  rackName: string | null;
  shelfName: string | null;
  enclosureName: string | null;
  bindingName: string | null;
  priceInINR: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CopyDetailsListResult = {
  rows: CopyDetailsListRow[];
  total: number;
  page: number;
  limit: number;
};

export type CopyDetailsMetaResult = {
  books: Array<{ id: number; title: string }>;
  statuses: Array<{ id: number; name: string | null }>;
  entryModes: Array<{ id: number; name: string | null }>;
  racks: Array<{ id: number; name: string }>;
  shelves: Array<{ id: number; name: string }>;
  enclosures: Array<{ id: number; name: string }>;
  bindings: Array<{ id: number; name: string | null }>;
};

export type CopyDetailsDetail = {
  id: number;
  bookId: number;
  publishedYear: string | null;
  accessNumber: string | null;
  oldAccessNumber: string | null;
  type: string | null;
  issueType: string | null;
  statusId: number | null;
  enntryModeId: number | null;
  rackId: number | null;
  shelfId: number | null;
  voucherNumber: string | null;
  enclosureId: number | null;
  numberOfEnclosures: number | null;
  numberOfPages: number | null;
  priceInINR: string | null;
  bindingTypeId: number | null;
  isbn: string | null;
  remarks: string | null;
};

export type CopyDetailsUpsertInput = {
  bookId: number;
  publishedYear?: string | null;
  accessNumber?: string | null;
  oldAccessNumber?: string | null;
  type?: string | null;
  issueType?: string | null;
  statusId?: number | null;
  enntryModeId?: number | null;
  rackId?: number | null;
  shelfId?: number | null;
  voucherNumber?: string | null;
  enclosureId?: number | null;
  numberOfEnclosures?: number | null;
  numberOfPages?: number | null;
  priceInINR?: string | null;
  bindingTypeId?: number | null;
  isbn?: string | null;
  remarks?: string | null;
};

const buildListWhere = (
  filters: Omit<CopyDetailsListFilters, "page" | "limit">,
): SQL | undefined => {
  const parts: SQL[] = [];
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    parts.push(
      or(
        ilike(copyDetailsModel.accessNumber, term),
        ilike(copyDetailsModel.oldAccessNumber, term),
        ilike(copyDetailsModel.isbn, term),
        ilike(copyDetailsModel.type, term),
        ilike(copyDetailsModel.issueType, term),
        ilike(copyDetailsModel.voucherNumber, term),
        ilike(bookModel.title, term),
        ilike(bookModel.subTitle, term),
        ilike(publisherModel.name, term),
      )!,
    );
  }
  if (filters.statusId != null && !Number.isNaN(filters.statusId)) {
    parts.push(eq(copyDetailsModel.statusId, filters.statusId));
  }
  if (filters.entryModeId != null && !Number.isNaN(filters.entryModeId)) {
    parts.push(eq(copyDetailsModel.enntryModeId, filters.entryModeId));
  }
  if (filters.rackId != null && !Number.isNaN(filters.rackId)) {
    parts.push(eq(copyDetailsModel.rackId, filters.rackId));
  }
  if (filters.shelfId != null && !Number.isNaN(filters.shelfId)) {
    parts.push(eq(copyDetailsModel.shelfId, filters.shelfId));
  }
  if (filters.bindingTypeId != null && !Number.isNaN(filters.bindingTypeId)) {
    parts.push(eq(copyDetailsModel.bindingTypeId, filters.bindingTypeId));
  }
  if (filters.enclosureId != null && !Number.isNaN(filters.enclosureId)) {
    parts.push(eq(copyDetailsModel.enclosureId, filters.enclosureId));
  }
  if (filters.bookId != null && !Number.isNaN(filters.bookId)) {
    parts.push(eq(copyDetailsModel.bookId, filters.bookId));
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : and(...parts);
};

const copyDetailsListBase = () =>
  db
    .select({ total: count() })
    .from(copyDetailsModel)
    .innerJoin(bookModel, eq(copyDetailsModel.bookId, bookModel.id))
    .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id))
    .leftJoin(statusModel, eq(copyDetailsModel.statusId, statusModel.id))
    .leftJoin(
      entryModeModel,
      eq(copyDetailsModel.enntryModeId, entryModeModel.id),
    )
    .leftJoin(rackModel, eq(copyDetailsModel.rackId, rackModel.id))
    .leftJoin(shelfModel, eq(copyDetailsModel.shelfId, shelfModel.id))
    .leftJoin(
      enclosureModel,
      eq(copyDetailsModel.enclosureId, enclosureModel.id),
    )
    .leftJoin(
      bindingModel,
      eq(copyDetailsModel.bindingTypeId, bindingModel.id),
    );

export async function findCopyDetailsPaginated(
  filters: CopyDetailsListFilters,
): Promise<CopyDetailsListResult> {
  const { page, limit, ...rest } = filters;
  const offset = (page - 1) * limit;
  const whereClause = buildListWhere(rest);

  const [{ total }] = await copyDetailsListBase().where(whereClause);

  const rows = await db
    .select({
      id: copyDetailsModel.id,
      bookId: copyDetailsModel.bookId,
      bookTitle: bookModel.title,
      publisherName: publisherModel.name,
      accessNumber: copyDetailsModel.accessNumber,
      oldAccessNumber: copyDetailsModel.oldAccessNumber,
      isbn: copyDetailsModel.isbn,
      publishedYear: copyDetailsModel.publishedYear,
      statusName: statusModel.name,
      entryModeName: entryModeModel.name,
      rackName: rackModel.name,
      shelfName: shelfModel.name,
      enclosureName: enclosureModel.name,
      bindingName: bindingModel.name,
      priceInINR: copyDetailsModel.priceInINR,
      createdAt: copyDetailsModel.createdAt,
      updatedAt: copyDetailsModel.updatedAt,
    })
    .from(copyDetailsModel)
    .innerJoin(bookModel, eq(copyDetailsModel.bookId, bookModel.id))
    .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id))
    .leftJoin(statusModel, eq(copyDetailsModel.statusId, statusModel.id))
    .leftJoin(
      entryModeModel,
      eq(copyDetailsModel.enntryModeId, entryModeModel.id),
    )
    .leftJoin(rackModel, eq(copyDetailsModel.rackId, rackModel.id))
    .leftJoin(shelfModel, eq(copyDetailsModel.shelfId, shelfModel.id))
    .leftJoin(
      enclosureModel,
      eq(copyDetailsModel.enclosureId, enclosureModel.id),
    )
    .leftJoin(bindingModel, eq(copyDetailsModel.bindingTypeId, bindingModel.id))
    .where(whereClause)
    .orderBy(desc(copyDetailsModel.id))
    .limit(limit)
    .offset(offset);

  return {
    rows,
    total,
    page,
    limit,
  };
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

export async function exportCopyDetailsExcel(
  filters: CopyDetailsExportFilters,
): Promise<Buffer> {
  const whereClause = buildListWhere(filters);

  const rows = await db
    .select({
      id: copyDetailsModel.id,
      bookId: copyDetailsModel.bookId,
      bookTitle: bookModel.title,
      publisherName: publisherModel.name,
      accessNumber: copyDetailsModel.accessNumber,
      oldAccessNumber: copyDetailsModel.oldAccessNumber,
      isbn: copyDetailsModel.isbn,
      publishedYear: copyDetailsModel.publishedYear,
      statusName: statusModel.name,
      entryModeName: entryModeModel.name,
      rackName: rackModel.name,
      shelfName: shelfModel.name,
      enclosureName: enclosureModel.name,
      bindingName: bindingModel.name,
      priceInINR: copyDetailsModel.priceInINR,
      createdAt: copyDetailsModel.createdAt,
      updatedAt: copyDetailsModel.updatedAt,
    })
    .from(copyDetailsModel)
    .innerJoin(bookModel, eq(copyDetailsModel.bookId, bookModel.id))
    .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id))
    .leftJoin(statusModel, eq(copyDetailsModel.statusId, statusModel.id))
    .leftJoin(
      entryModeModel,
      eq(copyDetailsModel.enntryModeId, entryModeModel.id),
    )
    .leftJoin(rackModel, eq(copyDetailsModel.rackId, rackModel.id))
    .leftJoin(shelfModel, eq(copyDetailsModel.shelfId, shelfModel.id))
    .leftJoin(
      enclosureModel,
      eq(copyDetailsModel.enclosureId, enclosureModel.id),
    )
    .leftJoin(bindingModel, eq(copyDetailsModel.bindingTypeId, bindingModel.id))
    .where(whereClause)
    .orderBy(desc(copyDetailsModel.id))
    .limit(100_000);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Copy details");

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Book ID", key: "bookId", width: 10 },
    { header: "Book title", key: "bookTitle", width: 42 },
    { header: "Publisher", key: "publisher", width: 28 },
    { header: "Accession", key: "accessNumber", width: 16 },
    { header: "Old accession", key: "oldAccessNumber", width: 16 },
    { header: "ISBN", key: "isbn", width: 18 },
    { header: "Published year", key: "publishedYear", width: 14 },
    { header: "Status", key: "status", width: 18 },
    { header: "Entry mode", key: "entryMode", width: 28 },
    { header: "Rack", key: "rack", width: 22 },
    { header: "Shelf", key: "shelf", width: 14 },
    { header: "Enclosure", key: "enclosure", width: 22 },
    { header: "Binding", key: "binding", width: 16 },
    { header: "Price (INR)", key: "priceInINR", width: 14 },
    { header: "Created at", key: "createdAt", width: 22 },
    { header: "Updated at", key: "updatedAt", width: 22 },
  ];

  for (const row of rows) {
    sheet.addRow({
      id: row.id,
      bookId: row.bookId,
      bookTitle: row.bookTitle ?? "",
      publisher: row.publisherName ?? "",
      accessNumber: row.accessNumber ?? "",
      oldAccessNumber: row.oldAccessNumber ?? "",
      isbn: row.isbn ?? "",
      publishedYear: row.publishedYear ?? "",
      status: row.statusName ?? "",
      entryMode: row.entryModeName ?? "",
      rack: row.rackName ?? "",
      shelf: row.shelfName ?? "",
      enclosure: row.enclosureName ?? "",
      binding: row.bindingName ?? "",
      priceInINR: row.priceInINR ?? "",
      createdAt: formatExcelDateTime(row.createdAt),
      updatedAt: formatExcelDateTime(row.updatedAt),
    });
  }

  applyStandardExcelReportTableStyling(sheet);

  const result = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(result) ? result : Buffer.from(result);
}

export async function getBookTitleById(bookId: number): Promise<string | null> {
  const [row] = await db
    .select({ title: bookModel.title })
    .from(bookModel)
    .where(eq(bookModel.id, bookId))
    .limit(1);
  return row?.title ?? null;
}

export async function getCopyDetailsMeta(): Promise<CopyDetailsMetaResult> {
  const [books, statuses, entryModes, racks, shelves, enclosures, bindings] =
    await Promise.all([
      db
        .select({ id: bookModel.id, title: bookModel.title })
        .from(bookModel)
        .orderBy(desc(bookModel.id))
        .limit(500),
      db
        .select({ id: statusModel.id, name: statusModel.name })
        .from(statusModel)
        .orderBy(desc(statusModel.id)),
      db
        .select({ id: entryModeModel.id, name: entryModeModel.name })
        .from(entryModeModel)
        .orderBy(desc(entryModeModel.id)),
      db
        .select({ id: rackModel.id, name: rackModel.name })
        .from(rackModel)
        .orderBy(desc(rackModel.id)),
      db
        .select({ id: shelfModel.id, name: shelfModel.name })
        .from(shelfModel)
        .orderBy(desc(shelfModel.id))
        .limit(500),
      db
        .select({ id: enclosureModel.id, name: enclosureModel.name })
        .from(enclosureModel)
        .orderBy(desc(enclosureModel.id))
        .limit(300),
      db
        .select({ id: bindingModel.id, name: bindingModel.name })
        .from(bindingModel)
        .orderBy(desc(bindingModel.id)),
    ]);

  return {
    books,
    statuses,
    entryModes,
    racks,
    shelves,
    enclosures,
    bindings,
  };
}

export async function getCopyDetailsById(
  id: number,
): Promise<CopyDetailsDetail | null> {
  const [row] = await db
    .select({
      id: copyDetailsModel.id,
      bookId: copyDetailsModel.bookId,
      publishedYear: copyDetailsModel.publishedYear,
      accessNumber: copyDetailsModel.accessNumber,
      oldAccessNumber: copyDetailsModel.oldAccessNumber,
      type: copyDetailsModel.type,
      issueType: copyDetailsModel.issueType,
      statusId: copyDetailsModel.statusId,
      enntryModeId: copyDetailsModel.enntryModeId,
      rackId: copyDetailsModel.rackId,
      shelfId: copyDetailsModel.shelfId,
      voucherNumber: copyDetailsModel.voucherNumber,
      enclosureId: copyDetailsModel.enclosureId,
      numberOfEnclosures: copyDetailsModel.numberOfEnclosures,
      numberOfPages: copyDetailsModel.numberOfPages,
      priceInINR: copyDetailsModel.priceInINR,
      bindingTypeId: copyDetailsModel.bindingTypeId,
      isbn: copyDetailsModel.isbn,
      remarks: copyDetailsModel.remarks,
    })
    .from(copyDetailsModel)
    .where(eq(copyDetailsModel.id, id))
    .limit(1);
  return row ?? null;
}

function upsertValues(input: CopyDetailsUpsertInput) {
  return {
    bookId: input.bookId,
    publishedYear: input.publishedYear?.trim() || null,
    accessNumber: input.accessNumber?.trim() || null,
    oldAccessNumber: input.oldAccessNumber?.trim() || null,
    type: input.type?.trim() || null,
    issueType: input.issueType?.trim() || null,
    statusId: input.statusId ?? null,
    enntryModeId: input.enntryModeId ?? null,
    rackId: input.rackId ?? null,
    shelfId: input.shelfId ?? null,
    voucherNumber: input.voucherNumber?.trim() || null,
    enclosureId: input.enclosureId ?? null,
    numberOfEnclosures: input.numberOfEnclosures ?? 0,
    numberOfPages: input.numberOfPages ?? 0,
    priceInINR: input.priceInINR?.trim() || null,
    bindingTypeId: input.bindingTypeId ?? null,
    isbn: input.isbn?.trim() || null,
    remarks: input.remarks?.trim() || null,
  };
}

export async function createCopyDetails(
  input: CopyDetailsUpsertInput,
  createdById: number | null,
): Promise<number> {
  const [inserted] = await db
    .insert(copyDetailsModel)
    .values({
      ...upsertValues(input),
      createdById: createdById ?? null,
    })
    .returning({ id: copyDetailsModel.id });
  return inserted.id;
}

export async function updateCopyDetails(
  id: number,
  input: CopyDetailsUpsertInput,
  updatedById: number | null,
): Promise<void> {
  await db
    .update(copyDetailsModel)
    .set({
      ...upsertValues(input),
      updatedById: updatedById ?? null,
      updatedAt: new Date(),
    })
    .where(eq(copyDetailsModel.id, id));
}
