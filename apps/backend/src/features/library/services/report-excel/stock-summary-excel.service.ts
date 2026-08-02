/**
 * Stock summary — two sheets:
 *  1. `Physical stock` — every copy in `copy_details`, grouped by Branch ×
 *     Article type × Item category × Status. Total price sums each copy's
 *     `price_in_inr` (per-copy prices vary within a book, so SUM is the
 *     right aggregation — verified against develop data).
 *  2. `Journal subscriptions` — every active + expired subscription from
 *     `library_journal_subscriptions`, grouped by Journal × frequency ×
 *     active flag, with the annual `cost_per_year` summed. Journals whose
 *     issues aren't tracked as physical copies still show their spend here.
 */

import { db } from "@/db/index.js";
import { and, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { branchModel } from "@repo/db/schemas/models/library/branch.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { libraryDocumentTypeModel } from "@repo/db/schemas/models/library/library-document-type.model.js";
// journals / journal_types / library_journal_subscriptions are queried via
// raw SQL (`db.execute(sql\`SELECT ... FROM journals j LEFT JOIN ...\`)`) so
// no drizzle model imports needed for those tables.
import { buildStandardWorkbook } from "../report-common/build-standard-workbook.js";
import type { LibraryReportFilters } from "../report-common/library-report-filters.js";
import { formatInrCompactForExcel, formatIntIN } from "@/utils/format-inr.js";

export async function exportStockSummaryExcel(
  f: LibraryReportFilters,
): Promise<Buffer> {
  const conds: SQL[] = [];
  if (f.branchId != null) conds.push(eq(copyDetailsModel.branchId, f.branchId));
  if (f.itemCategoryIds && f.itemCategoryIds.length > 0)
    conds.push(
      sql`${copyDetailsModel.itemCategoryId} IN (${sql.join(
        f.itemCategoryIds.map((n) => sql`${n}`),
        sql`, `,
      )})`,
    );
  const where = conds.length > 0 ? and(...conds) : undefined;

  const rows = await db
    .select({
      branchId: copyDetailsModel.branchId,
      branchName: branchModel.name,
      articleTypeId: bookModel.libraryDocumentTypeId,
      articleTypeName: libraryDocumentTypeModel.name,
      itemCategoryId: copyDetailsModel.itemCategoryId,
      itemCategoryName: itemCategoryModel.name,
      statusId: copyDetailsModel.statusId,
      statusName: statusModel.name,
      copies: count(copyDetailsModel.id),
      totalPrice: sql<number>`COALESCE(SUM(NULLIF(${copyDetailsModel.priceInINR}, '')::numeric), 0)`,
    })
    .from(copyDetailsModel)
    .innerJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
    .leftJoin(branchModel, eq(branchModel.id, copyDetailsModel.branchId))
    .leftJoin(
      libraryDocumentTypeModel,
      eq(libraryDocumentTypeModel.id, bookModel.libraryDocumentTypeId),
    )
    .leftJoin(
      itemCategoryModel,
      eq(itemCategoryModel.id, copyDetailsModel.itemCategoryId),
    )
    .leftJoin(statusModel, eq(statusModel.id, copyDetailsModel.statusId))
    .where(where)
    .groupBy(
      copyDetailsModel.branchId,
      branchModel.name,
      bookModel.libraryDocumentTypeId,
      libraryDocumentTypeModel.name,
      copyDetailsModel.itemCategoryId,
      itemCategoryModel.name,
      copyDetailsModel.statusId,
      statusModel.name,
    )
    .orderBy(desc(count(copyDetailsModel.id)));

  const sheetRows = rows.map((r) => ({
    Branch: r.branchName ?? "",
    "Article type": r.articleTypeName ?? "",
    "Item category": r.itemCategoryName ?? "",
    Status: r.statusName ?? "",
    "Number of copies": formatIntIN(r.copies),
    "Total price": formatInrCompactForExcel(r.totalPrice),
  }));

  const stockTotals = {
    Branch: "TOTAL",
    "Article type": "",
    "Item category": "",
    Status: "",
    "Number of copies": formatIntIN(
      rows.reduce((s, r) => s + Number(r.copies), 0),
    ),
    "Total price": formatInrCompactForExcel(
      rows.reduce((s, r) => s + Number(r.totalPrice), 0),
    ),
  };

  // Journals — one row per journal record (there are 121 on develop even
  // though the subscriptions table is empty). Aggregates BOTH the physical
  // side (books.journal_id_fk → copies in copy_details) and the subscription
  // side (library_journal_subscriptions per-year cost) so librarians see
  // every journal in the library, whether it has copies, subscriptions, or
  // both.
  const journalRowsRaw = await db.execute(sql`
    SELECT
      j.id                                                  AS journal_id,
      j.title                                               AS title,
      j.issn_number                                         AS issn,
      jt.name                                               AS journal_type,
      COALESCE(book_agg.linked_books, 0)::int              AS linked_books,
      COALESCE(book_agg.copies, 0)::int                    AS copies,
      COALESCE(sub_agg.subs, 0)::int                       AS subscriptions,
      COALESCE(sub_agg.active_subs, 0)::int                AS active_subscriptions,
      COALESCE(sub_agg.annual_cost, 0)                     AS annual_cost
    FROM journals j
    LEFT JOIN journal_types jt ON jt.id = j.journal_type_id_fk
    LEFT JOIN (
      SELECT b.journal_id_fk AS journal_id,
             COUNT(DISTINCT b.id) AS linked_books,
             COUNT(cd.id)         AS copies
      FROM books b
      LEFT JOIN copy_details cd ON cd.book_id_fk = b.id
      WHERE b.journal_id_fk IS NOT NULL
      GROUP BY b.journal_id_fk
    ) book_agg ON book_agg.journal_id = j.id
    LEFT JOIN (
      SELECT journal_id_fk AS journal_id,
             COUNT(*)                                                   AS subs,
             COUNT(*) FILTER (WHERE is_active)                          AS active_subs,
             COALESCE(SUM(CASE WHEN is_active THEN cost_per_year END), 0) AS annual_cost
      FROM library_journal_subscriptions
      GROUP BY journal_id_fk
    ) sub_agg ON sub_agg.journal_id = j.id
    ORDER BY copies DESC, subscriptions DESC, j.title ASC
  `);
  const journalRows = journalRowsRaw.rows as Array<{
    journal_id: number;
    title: string;
    issn: string | null;
    journal_type: string | null;
    linked_books: number;
    copies: number;
    subscriptions: number;
    active_subscriptions: number;
    annual_cost: string | number;
  }>;

  const journalSheetRows = journalRows.map((r) => ({
    "Journal title": r.title ?? "",
    "Journal type": r.journal_type ?? "",
    ISSN: r.issn ?? "",
    "Number of linked books": formatIntIN(r.linked_books),
    "Number of copies": formatIntIN(r.copies),
    "Active subscriptions": formatIntIN(r.active_subscriptions),
    "Total subscriptions": formatIntIN(r.subscriptions),
    "Annual subscription cost": formatInrCompactForExcel(Number(r.annual_cost)),
  }));

  const journalTotals = {
    "Journal title": "TOTAL",
    "Journal type": "",
    ISSN: "",
    "Number of linked books": formatIntIN(
      journalRows.reduce((s, r) => s + Number(r.linked_books), 0),
    ),
    "Number of copies": formatIntIN(
      journalRows.reduce((s, r) => s + Number(r.copies), 0),
    ),
    "Active subscriptions": formatIntIN(
      journalRows.reduce((s, r) => s + Number(r.active_subscriptions), 0),
    ),
    "Total subscriptions": formatIntIN(
      journalRows.reduce((s, r) => s + Number(r.subscriptions), 0),
    ),
    "Annual subscription cost": formatInrCompactForExcel(
      journalRows.reduce((s, r) => s + Number(r.annual_cost), 0),
    ),
  };

  return buildStandardWorkbook([
    {
      name: "Physical stock",
      columns: [
        { header: "Branch", key: "Branch", width: 30 },
        { header: "Article type", key: "Article type", width: 22 },
        { header: "Item category", key: "Item category", width: 22 },
        { header: "Status", key: "Status", width: 22 },
        { header: "Number of copies", key: "Number of copies", width: 22 },
        { header: "Total price", key: "Total price", width: 20 },
      ],
      rows: sheetRows,
      totals: stockTotals,
      moneyKeys: ["Total price"],
    },
    {
      name: "Journals",
      columns: [
        { header: "Journal title", key: "Journal title", width: 42 },
        { header: "Journal type", key: "Journal type", width: 26 },
        { header: "ISSN", key: "ISSN", width: 18 },
        {
          header: "Number of linked books",
          key: "Number of linked books",
          width: 24,
        },
        { header: "Number of copies", key: "Number of copies", width: 20 },
        {
          header: "Active subscriptions",
          key: "Active subscriptions",
          width: 20,
        },
        {
          header: "Total subscriptions",
          key: "Total subscriptions",
          width: 20,
        },
        {
          header: "Annual subscription cost",
          key: "Annual subscription cost",
          width: 24,
        },
      ],
      rows: journalSheetRows,
      totals: journalTotals,
      moneyKeys: ["Annual subscription cost"],
    },
  ]);
}
