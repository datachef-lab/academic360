/**
 * Available copies — every copy in `copy_details` that is currently on the
 * shelf, i.e. has NO open row in `book_circulation` (an open row means the
 * copy is issued or reissued and `actual_return_timestamp` is still NULL —
 * the same availability rule the issue picker uses in
 * book-circulation.service.ts `searchBookOptions`).
 *
 * One sheet, one row per available copy with book, branch, item category and
 * status context, plus a totals row (copy count + summed price).
 */

import { db } from "@/db/index.js";
import { and, asc, eq, isNull, notExists, sql, type SQL } from "drizzle-orm";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { branchModel } from "@repo/db/schemas/models/library/branch.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { buildStandardWorkbook } from "../report-common/build-standard-workbook.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import { formatInrCompactForExcel, formatIntIN } from "@/utils/format-inr.js";

export async function exportAvailableCopiesExcel(
  f: LibraryReportFilters,
): Promise<Buffer> {
  const conds: SQL[] = [
    notExists(
      db
        .select({ id: bookCirculationModel.id })
        .from(bookCirculationModel)
        .where(
          and(
            eq(bookCirculationModel.copyDetailsId, copyDetailsModel.id),
            isNull(bookCirculationModel.actualReturnTimestamp),
          ),
        ),
    ),
  ];
  if (f.branchId != null) conds.push(eq(copyDetailsModel.branchId, f.branchId));
  if (f.itemCategoryIds && f.itemCategoryIds.length > 0)
    conds.push(
      sql`${copyDetailsModel.itemCategoryId} IN (${sql.join(
        f.itemCategoryIds.map((n) => sql`${n}`),
        sql`, `,
      )})`,
    );

  const rows = await db
    .select({
      accessNumber: copyDetailsModel.accessNumber,
      title: bookModel.title,
      publisherName: publisherModel.name,
      branchName: branchModel.name,
      itemCategoryName: itemCategoryModel.name,
      statusName: statusModel.name,
      price: sql<number>`COALESCE(NULLIF(${copyDetailsModel.priceInINR}, '')::numeric, 0)`,
    })
    .from(copyDetailsModel)
    .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
    .leftJoin(publisherModel, eq(publisherModel.id, bookModel.publisherId))
    .leftJoin(branchModel, eq(branchModel.id, copyDetailsModel.branchId))
    .leftJoin(
      itemCategoryModel,
      eq(itemCategoryModel.id, copyDetailsModel.itemCategoryId),
    )
    .leftJoin(statusModel, eq(statusModel.id, copyDetailsModel.statusId))
    .where(and(...conds))
    .orderBy(asc(bookModel.title), asc(copyDetailsModel.accessNumber));

  const sheetRows = rows.map((r) => ({
    "Access No.": r.accessNumber ?? "",
    "Book title": r.title ?? "",
    Publisher: r.publisherName ?? "",
    Branch: r.branchName ?? "",
    "Item category": r.itemCategoryName ?? "",
    Status: r.statusName ?? "",
    Price: formatInrCompactForExcel(Number(r.price)),
  }));

  const totals = {
    "Access No.": "TOTAL",
    "Book title": `${formatIntIN(rows.length)} available copies`,
    Publisher: "",
    Branch: "",
    "Item category": "",
    Status: "",
    Price: formatInrCompactForExcel(
      rows.reduce((s, r) => s + Number(r.price), 0),
    ),
  };

  return buildStandardWorkbook([
    {
      name: "Available copies",
      columns: [
        { header: "Access No.", key: "Access No.", width: 16 },
        { header: "Book title", key: "Book title", width: 48 },
        { header: "Publisher", key: "Publisher", width: 30 },
        { header: "Branch", key: "Branch", width: 26 },
        { header: "Item category", key: "Item category", width: 22 },
        { header: "Status", key: "Status", width: 20 },
        { header: "Price", key: "Price", width: 16 },
      ],
      rows: sheetRows,
      totals,
      moneyKeys: ["Price"],
    },
  ]);
}
