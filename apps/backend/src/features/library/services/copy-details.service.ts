import ExcelJS from "exceljs";
import { db } from "@/db/index.js";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { applyStandardExcelReportTableStyling } from "@/utils/excel-report-styling.js";
import { bindingModel } from "@repo/db/schemas/models/library/binding.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { branchModel } from "@repo/db/schemas/models/library/branch.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { enclosureModel } from "@repo/db/schemas/models/library/enclosure.model.js";
import { entryModeModel } from "@repo/db/schemas/models/library/entry-mode.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { rackModel } from "@repo/db/schemas/models/library/rack.model.js";
import { shelfModel } from "@repo/db/schemas/models/library/shelf.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { vendorModel } from "@repo/db/schemas/models/library/vendor.model.js";
import { personModel } from "@repo/db/schemas/models/user/person.model.js";

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
  branchId?: number;
  itemCategoryId?: number;
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
  if (filters.branchId != null && !Number.isNaN(filters.branchId)) {
    parts.push(eq(copyDetailsModel.branchId, filters.branchId));
  }
  if (filters.itemCategoryId != null && !Number.isNaN(filters.itemCategoryId)) {
    parts.push(eq(copyDetailsModel.itemCategoryId, filters.itemCategoryId));
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

export async function countCopyCirculations(
  copyDetailsId: number,
): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(bookCirculationModel)
    .where(eq(bookCirculationModel.copyDetailsId, copyDetailsId));
  return total;
}

export async function deleteCopyDetails(id: number): Promise<void> {
  await db.delete(copyDetailsModel).where(eq(copyDetailsModel.id, id));
}

// ---------------------------------------------------------------------------
// Bulk upload of copy_details via Excel
// ---------------------------------------------------------------------------

type CopyTemplateColumn = {
  header: string;
  key: string;
  type: "string" | "number" | "boolean" | "date" | "lookup";
  lookupTable?:
    | "branch"
    | "itemCategory"
    | "status"
    | "entryMode"
    | "rack"
    | "shelf"
    | "enclosure"
    | "binding"
    | "vendor"
    | "person";
  width?: number;
  note?: string;
};

const COPY_TEMPLATE_COLUMNS: CopyTemplateColumn[] = [
  { header: "Access Number *", key: "accessNumber", type: "string", width: 22 },
  {
    header: "Old Access Number",
    key: "oldAccessNumber",
    type: "string",
    width: 22,
  },
  { header: "Type", key: "type", type: "string", width: 14 },
  { header: "Issue Type", key: "issueType", type: "string", width: 14 },
  { header: "RFID Number", key: "rfidNumber", type: "string", width: 18 },
  {
    header: "Theft Bit Armed (TRUE/FALSE)",
    key: "theftBitArmed",
    type: "boolean",
    width: 14,
  },
  { header: "Published Year", key: "publishedYear", type: "string", width: 14 },
  { header: "Voucher Number", key: "voucherNumber", type: "string", width: 16 },
  {
    header: "Number of Enclosures",
    key: "numberOfEnclosures",
    type: "number",
    width: 14,
  },
  {
    header: "Number of Pages",
    key: "numberOfPages",
    type: "number",
    width: 14,
  },
  { header: "Price (INR)", key: "priceInINR", type: "string", width: 14 },
  {
    header: "Price (Foreign Currency)",
    key: "priceForeignCurrency",
    type: "string",
    width: 18,
  },
  { header: "Purchase Price", key: "purchasePrice", type: "string", width: 14 },
  { header: "Set Price", key: "setPrice", type: "string", width: 14 },
  { header: "ISBN", key: "isbn", type: "string", width: 18 },
  { header: "Book Volume", key: "bookVolume", type: "string", width: 14 },
  { header: "Book Part", key: "bookPart", type: "string", width: 12 },
  { header: "Book Part Info", key: "bookPartInfo", type: "string", width: 18 },
  { header: "Volume Info", key: "volumeInfo", type: "string", width: 18 },
  { header: "Remarks", key: "remarks", type: "string", width: 30 },
  { header: "Prefix", key: "prefix", type: "string", width: 12 },
  { header: "Suffix", key: "suffix", type: "string", width: 12 },
  { header: "Book Size", key: "bookSize", type: "string", width: 14 },
  {
    header: "Bill Date (YYYY-MM-DD)",
    key: "billDate",
    type: "date",
    width: 16,
  },
  { header: "Discount", key: "discount", type: "string", width: 12 },
  {
    header: "Shipping Charges",
    key: "shippingCharges",
    type: "string",
    width: 14,
  },
  {
    header: "Legacy Vendor ID",
    key: "legacyVendorId",
    type: "number",
    width: 14,
  },
  {
    header: "Legacy Copy Details ID",
    key: "legacyCopyDetailsId",
    type: "number",
    width: 14,
  },
  {
    header: "Branch (name)",
    key: "branchName",
    type: "lookup",
    lookupTable: "branch",
    width: 18,
  },
  {
    header: "Item Category (name)",
    key: "itemCategoryName",
    type: "lookup",
    lookupTable: "itemCategory",
    width: 18,
  },
  {
    header: "Status (name)",
    key: "statusName",
    type: "lookup",
    lookupTable: "status",
    width: 16,
  },
  {
    header: "Entry Mode (name)",
    key: "entryModeName",
    type: "lookup",
    lookupTable: "entryMode",
    width: 16,
  },
  {
    header: "Rack (name)",
    key: "rackName",
    type: "lookup",
    lookupTable: "rack",
    width: 14,
  },
  {
    header: "Shelf (name)",
    key: "shelfName",
    type: "lookup",
    lookupTable: "shelf",
    width: 14,
  },
  {
    header: "Enclosure (name)",
    key: "enclosureName",
    type: "lookup",
    lookupTable: "enclosure",
    width: 18,
  },
  {
    header: "Binding Type (name)",
    key: "bindingTypeName",
    type: "lookup",
    lookupTable: "binding",
    width: 18,
  },
  {
    header: "Vendor (name)",
    key: "vendorName",
    type: "lookup",
    lookupTable: "vendor",
    width: 18,
  },
  {
    header: "Donor Person (name)",
    key: "donorPersonName",
    type: "lookup",
    lookupTable: "person",
    width: 22,
  },
];

export async function generateCopyDetailsBulkTemplate(
  bookTitle?: string | null,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Copies");
  sheet.columns = COPY_TEMPLATE_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 16,
  }));
  applyStandardExcelReportTableStyling(sheet);
  if (bookTitle) {
    sheet.getCell("A1").note = `Bulk upload copies — ${bookTitle}`;
  }

  const notes = workbook.addWorksheet("Instructions");
  notes.columns = [
    { header: "Column", key: "col", width: 32 },
    { header: "Required", key: "req", width: 12 },
    { header: "Notes", key: "note", width: 80 },
  ];
  notes.addRow({
    col: "Access Number",
    req: "Yes",
    note: "Unique accession number for the copy. Rows without it will be skipped.",
  });
  notes.addRow({
    col: "Theft Bit Armed",
    req: "No",
    note: "Use TRUE/FALSE. Defaults to FALSE.",
  });
  notes.addRow({
    col: "Bill Date",
    req: "No",
    note: "ISO date, e.g. 2026-06-20. Other parseable strings are also accepted.",
  });
  notes.addRow({
    col: "*** (name)",
    req: "No",
    note: "These columns are matched by exact name (case-insensitive) against existing master records. Unknown names will fail the row with an error.",
  });
  notes.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

type ProgressUpdate = {
  jobId: string;
  bookId: number;
  status: "STARTED" | "ROW" | "COMPLETED";
  processed: number;
  succeeded: number;
  failed: number;
  total: number;
  lastError?: { row: number; message: string } | null;
  errors?: Array<{ row: number; message: string }>;
};

export type CopyBulkUploadSummary = {
  jobId: string;
  bookId: number;
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
};

const LOOKUP_TABLES = {
  branch: branchModel,
  itemCategory: itemCategoryModel,
  status: statusModel,
  entryMode: entryModeModel,
  rack: rackModel,
  shelf: shelfModel,
  enclosure: enclosureModel,
  binding: bindingModel,
  vendor: vendorModel,
  person: personModel,
} as const;

type LookupTableKey = keyof typeof LOOKUP_TABLES;

async function loadLookupMap(
  table: LookupTableKey,
): Promise<Map<string, number>> {
  const model = LOOKUP_TABLES[table];
  const rows = await db.select({ id: model.id, name: model.name }).from(model);
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.name) continue;
    map.set(row.name.trim().toLowerCase(), row.id);
  }
  return map;
}

function readCell(cell: ExcelJS.Cell): string {
  if (cell == null) return "";
  const value = cell.value;
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null) {
    if (
      "text" in value &&
      typeof (value as { text?: unknown }).text === "string"
    ) {
      return ((value as { text: string }).text ?? "").trim();
    }
    if (
      "richText" in value &&
      Array.isArray((value as { richText?: unknown }).richText)
    ) {
      return (value as { richText: Array<{ text?: string }> }).richText
        .map((r) => r.text ?? "")
        .join("")
        .trim();
    }
    if ("result" in value) {
      const r = (value as { result?: unknown }).result;
      if (typeof r === "string" || typeof r === "number")
        return String(r).trim();
    }
  }
  return String(value).trim();
}

function toBool(raw: string): boolean {
  const v = raw.toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "y";
}

function toNumberOrNull(raw: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function toDateOrNull(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function importCopyDetailsForBookExcel(opts: {
  bookId: number;
  buffer: Buffer;
  actorUserId: number | null;
  jobId: string;
  onProgress: (update: ProgressUpdate) => void;
}): Promise<CopyBulkUploadSummary> {
  const { bookId, buffer, actorUserId, jobId, onProgress } = opts;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    const summary: CopyBulkUploadSummary = {
      jobId,
      bookId,
      total: 0,
      succeeded: 0,
      failed: 0,
      errors: [{ row: 0, message: "Workbook has no sheets." }],
    };
    onProgress({
      jobId,
      bookId,
      status: "COMPLETED",
      processed: 0,
      succeeded: 0,
      failed: 0,
      total: 0,
      errors: summary.errors,
    });
    return summary;
  }

  // Header row → column index (1-based, ExcelJS style)
  const headerRow = sheet.getRow(1);
  const headerToCol = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const text = readCell(cell);
    if (text) headerToCol.set(text.trim().toLowerCase(), colNumber);
  });
  const colByKey = new Map<string, number>();
  for (const col of COPY_TEMPLATE_COLUMNS) {
    const idx = headerToCol.get(col.header.toLowerCase());
    if (idx) colByKey.set(col.key, idx);
  }

  // Pre-load all lookup tables that the file actually uses.
  const lookupKeysNeeded = new Set<LookupTableKey>();
  for (const col of COPY_TEMPLATE_COLUMNS) {
    if (col.type === "lookup" && col.lookupTable && colByKey.has(col.key)) {
      lookupKeysNeeded.add(col.lookupTable);
    }
  }
  const lookupMaps = new Map<LookupTableKey, Map<string, number>>();
  for (const key of lookupKeysNeeded) {
    lookupMaps.set(key, await loadLookupMap(key));
  }

  const dataRows: number[] = [];
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const hasAny =
      row.values &&
      (row.values as unknown[]).some((v) => v != null && v !== "");
    if (hasAny) dataRows.push(i);
  }
  const total = dataRows.length;

  onProgress({
    jobId,
    bookId,
    status: "STARTED",
    processed: 0,
    succeeded: 0,
    failed: 0,
    total,
  });

  const errors: Array<{ row: number; message: string }> = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const rowIndex = dataRows[i]!;
    const row = sheet.getRow(rowIndex);

    const getStr = (key: string): string => {
      const colIdx = colByKey.get(key);
      if (!colIdx) return "";
      return readCell(row.getCell(colIdx));
    };

    try {
      const accessNumber = getStr("accessNumber");
      if (!accessNumber) throw new Error("Access Number is required.");

      const resolveLookup = (
        key: string,
        tableKey: LookupTableKey,
      ): number | null => {
        const value = getStr(key);
        if (!value) return null;
        const map = lookupMaps.get(tableKey);
        if (!map) return null;
        const id = map.get(value.trim().toLowerCase());
        if (!id) {
          throw new Error(`Unknown ${tableKey} "${value}"`);
        }
        return id;
      };

      const billDate = toDateOrNull(getStr("billDate"));

      const values: typeof copyDetailsModel.$inferInsert = {
        bookId,
        accessNumber: accessNumber || null,
        oldAccessNumber: getStr("oldAccessNumber") || null,
        type: getStr("type") || null,
        issueType: getStr("issueType") || null,
        rfidNumber: getStr("rfidNumber") || null,
        theftBitArmed: toBool(getStr("theftBitArmed")),
        publishedYear: getStr("publishedYear") || null,
        voucherNumber: getStr("voucherNumber") || null,
        numberOfEnclosures: toNumberOrNull(getStr("numberOfEnclosures")) ?? 0,
        numberOfPages: toNumberOrNull(getStr("numberOfPages")) ?? 0,
        priceInINR: getStr("priceInINR") || null,
        priceForeignCurrency: getStr("priceForeignCurrency") || null,
        purchasePrice: getStr("purchasePrice") || null,
        setPrice: getStr("setPrice") || null,
        isbn: getStr("isbn") || null,
        bookVolume: getStr("bookVolume") || null,
        bookPart: getStr("bookPart") || null,
        bookPartInfo: getStr("bookPartInfo") || null,
        volumeInfo: getStr("volumeInfo") || null,
        remarks: getStr("remarks") || null,
        prefix: getStr("prefix") || null,
        suffix: getStr("suffix") || null,
        bookSize: getStr("bookSize") || null,
        billDate: billDate ?? undefined,
        discount: getStr("discount") || null,
        shippingCharges: getStr("shippingCharges") || null,
        legacyVendorId: toNumberOrNull(getStr("legacyVendorId")),
        legacyCopyDetailsId: toNumberOrNull(getStr("legacyCopyDetailsId")),
        branchId: resolveLookup("branchName", "branch"),
        itemCategoryId: resolveLookup("itemCategoryName", "itemCategory"),
        statusId: resolveLookup("statusName", "status"),
        enntryModeId: resolveLookup("entryModeName", "entryMode"),
        rackId: resolveLookup("rackName", "rack"),
        shelfId: resolveLookup("shelfName", "shelf"),
        enclosureId: resolveLookup("enclosureName", "enclosure"),
        bindingTypeId: resolveLookup("bindingTypeName", "binding"),
        vendorId: resolveLookup("vendorName", "vendor"),
        donorPersonId: resolveLookup("donorPersonName", "person"),
        createdById: actorUserId ?? null,
      };

      await db.insert(copyDetailsModel).values(values);
      succeeded += 1;
    } catch (err) {
      failed += 1;
      const message =
        err instanceof Error ? err.message : "Failed to insert row.";
      errors.push({ row: rowIndex, message });
    }

    onProgress({
      jobId,
      bookId,
      status: "ROW",
      processed: i + 1,
      succeeded,
      failed,
      total,
      lastError: errors[errors.length - 1] ?? null,
    });
  }

  const summary: CopyBulkUploadSummary = {
    jobId,
    bookId,
    total,
    succeeded,
    failed,
    errors,
  };

  onProgress({
    jobId,
    bookId,
    status: "COMPLETED",
    processed: total,
    succeeded,
    failed,
    total,
    errors,
  });

  return summary;
}
