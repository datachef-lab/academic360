import ExcelJS from "exceljs";
import { db } from "@/db/index.js";
import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { entryModeModel } from "@repo/db/schemas/models/library/entry-mode.model.js";
import { rackModel } from "@repo/db/schemas/models/library/rack.model.js";
import { shelfModel } from "@repo/db/schemas/models/library/shelf.model.js";
import { enclosureModel } from "@repo/db/schemas/models/library/enclosure.model.js";
import { bindingModel } from "@repo/db/schemas/models/library/binding.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { applyStandardExcelReportTableStyling } from "@/utils/excel-report-styling.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import type { ReportProgress } from "@/features/reports/report-job.service.js";

const NOT_ISSUABLE_FILL_ARGB = "FFFFC7CE";

const EXPORT_ROW_CAP = 10_000;

const YIELD_EVERY = 500;
const yieldToEventLoop = () =>
  new Promise<void>((resolve) => setImmediate(resolve));

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

export async function exportCopyDetailsReportExcel(
  f: LibraryReportFilters,
  onProgress?: ReportProgress,
): Promise<Buffer> {
  const conds: SQL[] = [];
  if (f.branchId != null) conds.push(eq(copyDetailsModel.branchId, f.branchId));
  if (f.itemCategoryIds && f.itemCategoryIds.length > 0) {
    conds.push(inArray(copyDetailsModel.itemCategoryId, f.itemCategoryIds));
  }
  const where = conds.length > 0 ? and(...conds) : undefined;

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
      itemCategoryName: itemCategoryModel.name,
      statusName: statusModel.name,
      isIssuable: statusModel.isIssuable,
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
      itemCategoryModel,
      eq(copyDetailsModel.itemCategoryId, itemCategoryModel.id),
    )
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
    .where(where)
    .orderBy(desc(copyDetailsModel.id))
    .limit(EXPORT_ROW_CAP);

  onProgress?.(20, `Fetched ${rows.length} copies, building workbook…`);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Copy details");

  sheet.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Book ID", key: "bookId", width: 10 },
    { header: "Book title", key: "bookTitle", width: 42 },
    { header: "Publisher", key: "publisher", width: 28 },
    { header: "Item category", key: "itemCategory", width: 22 },
    { header: "Accession", key: "accessNumber", width: 16 },
    { header: "Old accession", key: "oldAccessNumber", width: 16 },
    { header: "ISBN", key: "isbn", width: 18 },
    { header: "Published year", key: "publishedYear", width: 14 },
    { header: "Status", key: "status", width: 18 },
    { header: "Issuable", key: "issuable", width: 12 },
    { header: "Entry mode", key: "entryMode", width: 28 },
    { header: "Rack", key: "rack", width: 22 },
    { header: "Shelf", key: "shelf", width: 14 },
    { header: "Enclosure", key: "enclosure", width: 22 },
    { header: "Binding", key: "binding", width: 16 },
    { header: "Price (INR)", key: "priceInINR", width: 14 },
    { header: "Created at", key: "createdAt", width: 22 },
    { header: "Updated at", key: "updatedAt", width: 22 },
  ];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const isIssuable = row.isIssuable ?? false;
    const excelRow = sheet.addRow({
      id: row.id,
      bookId: row.bookId,
      bookTitle: row.bookTitle ?? "",
      publisher: row.publisherName ?? "",
      itemCategory: row.itemCategoryName ?? "",
      accessNumber: row.accessNumber ?? "",
      oldAccessNumber: row.oldAccessNumber ?? "",
      isbn: row.isbn ?? "",
      publishedYear: row.publishedYear ?? "",
      status: row.statusName ?? "",
      issuable: isIssuable ? "Yes" : "No",
      entryMode: row.entryModeName ?? "",
      rack: row.rackName ?? "",
      shelf: row.shelfName ?? "",
      enclosure: row.enclosureName ?? "",
      binding: row.bindingName ?? "",
      priceInINR: row.priceInINR ?? "",
      createdAt: formatExcelDateTime(row.createdAt),
      updatedAt: formatExcelDateTime(row.updatedAt),
    });

    if (!isIssuable) {
      excelRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: NOT_ISSUABLE_FILL_ARGB },
        };
      });
    }

    if (i > 0 && i % YIELD_EVERY === 0) {
      onProgress?.(
        20 + Math.round((i / rows.length) * 70),
        `Built ${i} of ${rows.length} rows…`,
      );
      await yieldToEventLoop();
    }
  }

  onProgress?.(90, "Applying formatting…");
  applyStandardExcelReportTableStyling(sheet);

  const result = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(result) ? result : Buffer.from(result);
}
