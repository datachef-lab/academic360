/**
 * Batch resolvers for the shared Book and Copy info blocks used by every
 * library report Excel export. One query each; joins pull the human-readable
 * names of the FK-linked masters (publisher, series, journal, language,
 * item category, status, rack, shelf, authors).
 *
 * Column headers use the same words the DB tables use — no jargon.
 */

import { db } from "@/db/index.js";
import { eq, inArray, sql } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { seriesModel } from "@repo/db/schemas/models/library/series.model.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { itemCategoryModel } from "@repo/db/schemas/models/library/item-category.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { rackModel } from "@repo/db/schemas/models/library/rack.model.js";
import { shelfModel } from "@repo/db/schemas/models/library/shelf.model.js";
import { languageMediumModel } from "@repo/db/schemas/models/resources/languageMedium.model.js";
import { authorDetailsModel } from "@repo/db/schemas/models/library/author-detail.model.js";
import { authorModel } from "@repo/db/schemas/models/library/author.model.js";
import { libraryDocumentTypeModel } from "@repo/db/schemas/models/library/library-document-type.model.js";
import { formatIstDate } from "@/utils/format-datetime.js";
import { formatInrForExcel } from "@/utils/format-inr.js";

export type BookContext = {
  bookId: number;
  title: string;
  articleType: string | null;
  subTitle: string | null;
  isbn: string | null;
  edition: string | null;
  publishedYear: number | null;
  publisher: string | null;
  series: string | null;
  journal: string | null;
  language: string | null;
  itemCategory: string | null;
  authors: string;
};

export type CopyContext = {
  copyId: number;
  bookId: number;
  accessionNumber: string | null;
  rfid: string | null;
  callNumber: string | null;
  status: string | null;
  rack: string | null;
  shelf: string | null;
  priceInINR: number | null;
  billDate: Date | null;
  itemCategory: string | null;
};

const EMPTY_BOOKS = new Map<number, BookContext>();
const EMPTY_COPIES = new Map<number, CopyContext>();

export async function enrichBooksForReport(
  bookIds: number[],
): Promise<Map<number, BookContext>> {
  if (bookIds.length === 0) return EMPTY_BOOKS;
  const ids = Array.from(new Set(bookIds.filter((n) => Number.isFinite(n))));
  if (ids.length === 0) return EMPTY_BOOKS;

  // Fetch item category via a first copy of the book — books don't carry
  // itemCategoryId directly (that lives on copy_details).
  const rows = await db
    .select({
      bookId: bookModel.id,
      title: bookModel.title,
      subTitle: bookModel.subTitle,
      isbn: bookModel.isbn,
      edition: bookModel.edition,
      publishedYear: bookModel.publishedYear,
      publisher: publisherModel.name,
      series: seriesModel.name,
      journal: journalModel.title,
      language: languageMediumModel.name,
      articleType: libraryDocumentTypeModel.name,
    })
    .from(bookModel)
    .leftJoin(publisherModel, eq(publisherModel.id, bookModel.publisherId))
    .leftJoin(seriesModel, eq(seriesModel.id, bookModel.seriesId))
    .leftJoin(journalModel, eq(journalModel.id, bookModel.journalId))
    .leftJoin(
      languageMediumModel,
      eq(languageMediumModel.id, bookModel.languageId),
    )
    .leftJoin(
      libraryDocumentTypeModel,
      eq(libraryDocumentTypeModel.id, bookModel.libraryDocumentTypeId),
    )
    .where(inArray(bookModel.id, ids));

  // Authors — aggregate names per book.
  const authorRows = await db
    .select({
      bookId: authorDetailsModel.bookId,
      name: authorModel.name,
    })
    .from(authorDetailsModel)
    .innerJoin(authorModel, eq(authorModel.id, authorDetailsModel.authorId))
    .where(inArray(authorDetailsModel.bookId, ids));
  const authorsByBook = new Map<number, string[]>();
  for (const r of authorRows) {
    if (r.bookId == null) continue;
    const list = authorsByBook.get(r.bookId) ?? [];
    list.push(r.name);
    authorsByBook.set(r.bookId, list);
  }

  // Item category — first-copy heuristic (all copies typically share the same
  // category; on mismatch we prefer the most common one).
  const itemCategoryRows = await db
    .select({
      bookId: copyDetailsModel.bookId,
      itemCategoryId: copyDetailsModel.itemCategoryId,
      name: itemCategoryModel.name,
      c: sql<number>`COUNT(*)::int`,
    })
    .from(copyDetailsModel)
    .leftJoin(
      itemCategoryModel,
      eq(itemCategoryModel.id, copyDetailsModel.itemCategoryId),
    )
    .where(inArray(copyDetailsModel.bookId, ids))
    .groupBy(
      copyDetailsModel.bookId,
      copyDetailsModel.itemCategoryId,
      itemCategoryModel.name,
    );
  const itemCategoryByBook = new Map<number, string | null>();
  const bestScore = new Map<number, number>();
  for (const r of itemCategoryRows) {
    if (r.bookId == null) continue;
    const prev = bestScore.get(r.bookId) ?? -1;
    if (r.c > prev) {
      bestScore.set(r.bookId, r.c);
      itemCategoryByBook.set(r.bookId, r.name ?? null);
    }
  }

  const out = new Map<number, BookContext>();
  for (const r of rows) {
    out.set(r.bookId, {
      bookId: r.bookId,
      title: r.title,
      articleType: r.articleType ?? null,
      subTitle: r.subTitle ?? null,
      isbn: r.isbn ?? null,
      edition: r.edition ?? null,
      publishedYear: r.publishedYear == null ? null : Number(r.publishedYear),
      publisher: r.publisher ?? null,
      series: r.series ?? null,
      journal: r.journal ?? null,
      language: r.language ?? null,
      itemCategory: itemCategoryByBook.get(r.bookId) ?? null,
      authors: (authorsByBook.get(r.bookId) ?? []).join("; "),
    });
  }
  return out;
}

export async function enrichCopiesForReport(
  copyIds: number[],
): Promise<Map<number, CopyContext>> {
  if (copyIds.length === 0) return EMPTY_COPIES;
  const ids = Array.from(new Set(copyIds.filter((n) => Number.isFinite(n))));
  if (ids.length === 0) return EMPTY_COPIES;

  const rows = await db
    .select({
      copyId: copyDetailsModel.id,
      bookId: copyDetailsModel.bookId,
      accessionNumber: copyDetailsModel.accessNumber,
      rfid: copyDetailsModel.rfidNumber,
      callNumber: bookModel.callNumber,
      status: statusModel.name,
      rack: rackModel.name,
      shelf: shelfModel.name,
      priceInINR: copyDetailsModel.priceInINR,
      billDate: copyDetailsModel.billDate,
      itemCategory: itemCategoryModel.name,
    })
    .from(copyDetailsModel)
    .leftJoin(bookModel, eq(bookModel.id, copyDetailsModel.bookId))
    .leftJoin(statusModel, eq(statusModel.id, copyDetailsModel.statusId))
    .leftJoin(rackModel, eq(rackModel.id, copyDetailsModel.rackId))
    .leftJoin(shelfModel, eq(shelfModel.id, copyDetailsModel.shelfId))
    .leftJoin(
      itemCategoryModel,
      eq(itemCategoryModel.id, copyDetailsModel.itemCategoryId),
    )
    .where(inArray(copyDetailsModel.id, ids));

  const out = new Map<number, CopyContext>();
  for (const r of rows) {
    out.set(r.copyId, {
      copyId: r.copyId,
      bookId: r.bookId,
      accessionNumber: r.accessionNumber ?? null,
      rfid: r.rfid ?? null,
      callNumber: r.callNumber ?? null,
      status: r.status ?? null,
      rack: r.rack ?? null,
      shelf: r.shelf ?? null,
      priceInINR: r.priceInINR == null ? null : Number(r.priceInINR),
      billDate: r.billDate ?? null,
      itemCategory: r.itemCategory ?? null,
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Row + column helpers so every report writes the block identically.
// ─────────────────────────────────────────────────────────────────────────────

const empty = <T>(v: T | null | undefined): T | "" => (v == null ? "" : v);

// "Book title" (not "Title") so mixed reports that also carry "Journal title"
// (publications-usage) don't leave the reader guessing which one is which.
// "Article type" (from library_document_types.name — e.g. GENERAL BOOK,
// JOURNAL, CD/DVD) sits right after the title so a reader knows what kind
// of item the row is about before scanning the metadata.
export function bookContextRow(
  b: BookContext | undefined,
): Record<string, unknown> {
  return {
    "Book title": empty(b?.title),
    "Article type": empty(b?.articleType),
    ISBN: empty(b?.isbn),
    Edition: empty(b?.edition),
    "Item category": empty(b?.itemCategory),
    Publisher: empty(b?.publisher),
    Authors: empty(b?.authors),
    "Published year": empty(b?.publishedYear),
    Language: empty(b?.language),
    Series: empty(b?.series),
    "Journal (if part of one)": empty(b?.journal),
    "Book sub-title": empty(b?.subTitle),
  };
}

export const BOOK_COLUMN_DEFS: Array<{
  header: string;
  key: string;
  width: number;
}> = [
  { header: "Book title", key: "Book title", width: 45 },
  { header: "Article type", key: "Article type", width: 20 },
  { header: "ISBN", key: "ISBN", width: 20 },
  { header: "Edition", key: "Edition", width: 14 },
  { header: "Item category", key: "Item category", width: 22 },
  { header: "Publisher", key: "Publisher", width: 32 },
  { header: "Authors", key: "Authors", width: 40 },
  { header: "Published year", key: "Published year", width: 16 },
  { header: "Language", key: "Language", width: 16 },
  { header: "Series", key: "Series", width: 24 },
  {
    header: "Journal (if part of one)",
    key: "Journal (if part of one)",
    width: 28,
  },
  { header: "Book sub-title", key: "Book sub-title", width: 34 },
];

// Copy = the physical/digital instance actually issued to a user, keyed by
// **Accession number**. Every book-circulation report leads with that.
export function copyContextRow(
  c: CopyContext | undefined,
): Record<string, unknown> {
  return {
    "Accession / Barcode Number": empty(c?.accessionNumber),
    "Copy status": empty(c?.status),
    "Call number": empty(c?.callNumber),
    Rack: empty(c?.rack),
    Shelf: empty(c?.shelf),
    "Copy RFID": empty(c?.rfid),
    "Price (INR)": formatInrForExcel(c?.priceInINR),
    "Bill date": formatIstDate(c?.billDate ?? null),
  };
}

export const COPY_COLUMN_DEFS: Array<{
  header: string;
  key: string;
  width: number;
}> = [
  {
    header: "Accession / Barcode Number",
    key: "Accession / Barcode Number",
    width: 24,
  },
  { header: "Copy status", key: "Copy status", width: 18 },
  { header: "Call number", key: "Call number", width: 20 },
  { header: "Rack", key: "Rack", width: 16 },
  { header: "Shelf", key: "Shelf", width: 16 },
  { header: "Copy RFID", key: "Copy RFID", width: 20 },
  { header: "Price (INR)", key: "Price (INR)", width: 18 },
  { header: "Bill date", key: "Bill date", width: 20 },
];
