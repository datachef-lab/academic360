import { db } from "@/db/index.js";
import { ilike, or, sql } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";

export type UnifiedSearchResultItem = {
  type: "book" | "journal" | "copy";
  id: number;
  title: string;
  subTitle: string | null;
  identifier: string | null;
};

export type UnifiedSearchResult = {
  query: string;
  totals: { books: number; journals: number; copies: number };
  items: UnifiedSearchResultItem[];
};

export async function unifiedSearch(
  query: string,
  limitPerType = 15,
): Promise<UnifiedSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: "",
      totals: { books: 0, journals: 0, copies: 0 },
      items: [],
    };
  }
  const term = `%${trimmed}%`;

  const [books, journals, copies] = await Promise.all([
    db
      .select({
        id: bookModel.id,
        title: bookModel.title,
        subTitle: bookModel.subTitle,
        identifier: bookModel.isbn,
      })
      .from(bookModel)
      .where(
        or(
          ilike(bookModel.title, term),
          ilike(bookModel.subTitle, term),
          ilike(bookModel.isbn, term),
          ilike(bookModel.keywords, term),
        ),
      )
      .limit(limitPerType),
    db
      .select({
        id: journalModel.id,
        title: journalModel.title,
        issnNumber: journalModel.issnNumber,
      })
      .from(journalModel)
      .where(
        or(
          ilike(journalModel.title, term),
          ilike(journalModel.issnNumber, term),
        ),
      )
      .limit(limitPerType),
    db
      .select({
        id: copyDetailsModel.id,
        accessNumber: copyDetailsModel.accessNumber,
        isbn: copyDetailsModel.isbn,
        bookId: copyDetailsModel.bookId,
      })
      .from(copyDetailsModel)
      .where(
        or(
          ilike(copyDetailsModel.accessNumber, term),
          ilike(copyDetailsModel.isbn, term),
          ilike(copyDetailsModel.rfidNumber, term),
        ),
      )
      .limit(limitPerType),
  ]);

  const items: UnifiedSearchResultItem[] = [
    ...books.map((b) => ({
      type: "book" as const,
      id: b.id,
      title: b.title,
      subTitle: b.subTitle,
      identifier: b.identifier,
    })),
    ...journals.map((j) => ({
      type: "journal" as const,
      id: j.id,
      title: j.title,
      subTitle: null,
      identifier: j.issnNumber,
    })),
    ...copies.map((c) => ({
      type: "copy" as const,
      id: c.id,
      title: `Copy #${c.accessNumber ?? c.id} (book #${c.bookId})`,
      subTitle: null,
      identifier: c.accessNumber,
    })),
  ];

  return {
    query: trimmed,
    totals: {
      books: books.length,
      journals: journals.length,
      copies: copies.length,
    },
    items,
  };
}
