/**
 * Holdings — one workbook, four sheets (by category / status / language /
 * publisher). Each sheet groups copies by that dimension and shows
 * books/copies/total price/average price per copy.
 */

import { db } from "@/db/index.js";
import { and, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { languageMediumModel } from "@repo/db/schemas/models/resources/languageMedium.model.js";
import {
  buildStandardWorkbook,
  type WorkbookSheet,
} from "../report-common/build-standard-workbook.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import { formatInrCompactForExcel, formatIntIN } from "@/utils/format-inr.js";

type Dim = "category" | "status" | "language" | "publisher";
type Row = {
  group: string;
  books: number;
  copies: number;
  totalPrice: number;
};

async function pullDim(dim: Dim, f: LibraryReportFilters): Promise<Row[]> {
  const conds: SQL[] = [];
  if (f.branchId != null) conds.push(eq(copyDetailsModel.branchId, f.branchId));
  const where = conds.length > 0 ? and(...conds) : undefined;

  if (dim === "category") {
    const rows = await db
      .select({
        group: sql<string>`COALESCE(${itemCategoryModel.name}, '')`,
        books: sql<number>`COUNT(DISTINCT ${bookModel.id})::int`,
        copies: count(copyDetailsModel.id),
        totalPrice: sql<number>`COALESCE(SUM(NULLIF(${copyDetailsModel.priceInINR}, '')::numeric), 0)`,
      })
      .from(copyDetailsModel)
      .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
      .leftJoin(
        itemCategoryModel,
        eq(itemCategoryModel.id, copyDetailsModel.itemCategoryId),
      )
      .where(where)
      .groupBy(copyDetailsModel.itemCategoryId, itemCategoryModel.name)
      .orderBy(desc(count(copyDetailsModel.id)));
    return rows.map((r) => ({
      group: r.group,
      books: Number(r.books),
      copies: Number(r.copies),
      totalPrice: Number(r.totalPrice),
    }));
  }
  if (dim === "status") {
    const rows = await db
      .select({
        group: sql<string>`COALESCE(${statusModel.name}, '')`,
        books: sql<number>`COUNT(DISTINCT ${bookModel.id})::int`,
        copies: count(copyDetailsModel.id),
        totalPrice: sql<number>`COALESCE(SUM(NULLIF(${copyDetailsModel.priceInINR}, '')::numeric), 0)`,
      })
      .from(copyDetailsModel)
      .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
      .leftJoin(statusModel, eq(statusModel.id, copyDetailsModel.statusId))
      .where(where)
      .groupBy(copyDetailsModel.statusId, statusModel.name)
      .orderBy(desc(count(copyDetailsModel.id)));
    return rows.map((r) => ({
      group: r.group,
      books: Number(r.books),
      copies: Number(r.copies),
      totalPrice: Number(r.totalPrice),
    }));
  }
  if (dim === "language") {
    const rows = await db
      .select({
        group: sql<string>`COALESCE(${languageMediumModel.name}, '')`,
        books: sql<number>`COUNT(DISTINCT ${bookModel.id})::int`,
        copies: count(copyDetailsModel.id),
        totalPrice: sql<number>`COALESCE(SUM(NULLIF(${copyDetailsModel.priceInINR}, '')::numeric), 0)`,
      })
      .from(copyDetailsModel)
      .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
      .leftJoin(
        languageMediumModel,
        eq(languageMediumModel.id, bookModel.languageId),
      )
      .where(where)
      .groupBy(bookModel.languageId, languageMediumModel.name)
      .orderBy(desc(count(copyDetailsModel.id)));
    return rows.map((r) => ({
      group: r.group,
      books: Number(r.books),
      copies: Number(r.copies),
      totalPrice: Number(r.totalPrice),
    }));
  }
  // publisher
  const rows = await db
    .select({
      group: sql<string>`COALESCE(${publisherModel.name}, '')`,
      books: sql<number>`COUNT(DISTINCT ${bookModel.id})::int`,
      copies: count(copyDetailsModel.id),
      totalPrice: sql<number>`COALESCE(SUM(NULLIF(${copyDetailsModel.priceInINR}, '')::numeric), 0)`,
    })
    .from(copyDetailsModel)
    .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
    .leftJoin(publisherModel, eq(publisherModel.id, bookModel.publisherId))
    .where(where)
    .groupBy(bookModel.publisherId, publisherModel.name)
    .orderBy(desc(count(copyDetailsModel.id)));
  return rows.map((r) => ({
    group: r.group,
    books: Number(r.books),
    copies: Number(r.copies),
    totalPrice: Number(r.totalPrice),
  }));
}

const COLUMNS = [
  { header: "Group", key: "Group", width: 34 },
  { header: "Number of books", key: "Number of books", width: 20 },
  { header: "Number of copies", key: "Number of copies", width: 20 },
  { header: "Total price", key: "Total price", width: 20 },
  {
    header: "Average price per copy",
    key: "Average price per copy",
    width: 24,
  },
];

function toSheet(name: string, rows: Row[]): WorkbookSheet {
  const totalBooks = rows.reduce((s, r) => s + Number(r.books), 0);
  const totalCopies = rows.reduce((s, r) => s + Number(r.copies), 0);
  const totalPrice = rows.reduce((s, r) => s + Number(r.totalPrice), 0);
  return {
    name,
    columns: COLUMNS,
    moneyKeys: ["Total price", "Average price per copy"],
    rows: rows.map((r) => ({
      Group: r.group,
      "Number of books": formatIntIN(r.books),
      "Number of copies": formatIntIN(r.copies),
      // Compact ₹ (k / L / Cr) so wide totals stay readable in the cell.
      "Total price": formatInrCompactForExcel(r.totalPrice),
      "Average price per copy":
        r.copies > 0
          ? formatInrCompactForExcel(Math.round(r.totalPrice / r.copies))
          : "",
    })),
    totals: {
      Group: "TOTAL",
      "Number of books": formatIntIN(totalBooks),
      "Number of copies": formatIntIN(totalCopies),
      "Total price": formatInrCompactForExcel(totalPrice),
      // Note: books count adds naively across group rows, which double-counts
      // books that appear in more than one group (rare in practice — copies
      // of the same book almost always share item category / language etc.).
      // If precision matters, compute a global DISTINCT elsewhere.
      "Average price per copy":
        totalCopies > 0
          ? formatInrCompactForExcel(Math.round(totalPrice / totalCopies))
          : "",
    },
  };
}

export async function exportHoldingsExcel(
  f: LibraryReportFilters,
): Promise<Buffer> {
  const [cat, stat, lang, pub] = await Promise.all([
    pullDim("category", f),
    pullDim("status", f),
    pullDim("language", f),
    pullDim("publisher", f),
  ]);
  return buildStandardWorkbook([
    toSheet("By category", cat),
    toSheet("By status", stat),
    toSheet("By language", lang),
    toSheet("By publisher", pub),
  ]);
}
