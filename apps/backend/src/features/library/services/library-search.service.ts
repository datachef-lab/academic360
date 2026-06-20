import { db } from "@/db/index.js";
import { ilike, or } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { libraryArticleModel } from "@repo/db/schemas/models/library/library-article.model.js";

export type UnifiedSearchType = "BOOK" | "JOURNAL" | "COPY" | "ARTICLE";

export type UnifiedSearchHit = {
  type: UnifiedSearchType;
  id: number;
  title: string;
  subtitle: string | null;
  meta: string | null;
};

export type UnifiedSearchResult = {
  query: string;
  total: number;
  totals: { books: number; journals: number; copies: number; articles: number };
  hits: UnifiedSearchHit[];
};

export type UnifiedSearchOptions = {
  type?: UnifiedSearchType;
  branchId?: number;
  limitPerType?: number;
};

export async function unifiedSearch(
  query: string,
  options: UnifiedSearchOptions = {},
): Promise<UnifiedSearchResult> {
  const { type, branchId, limitPerType = 15 } = options;
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query: "",
      total: 0,
      totals: { books: 0, journals: 0, copies: 0, articles: 0 },
      hits: [],
    };
  }
  const term = `%${trimmed}%`;

  const wantsBook = !type || type === "BOOK";
  const wantsJournal = !type || type === "JOURNAL";
  const wantsCopy = !type || type === "COPY";
  const wantsArticle = !type || type === "ARTICLE";

  const [books, journals, copies, articles] = await Promise.all([
    wantsBook
      ? db
          .select({
            id: bookModel.id,
            title: bookModel.title,
            subTitle: bookModel.subTitle,
            isbn: bookModel.isbn,
            branchId: bookModel.branchId,
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
          .limit(limitPerType)
      : Promise.resolve(
          [] as Array<{
            id: number;
            title: string;
            subTitle: string | null;
            isbn: string | null;
            branchId: number | null;
          }>,
        ),
    wantsJournal
      ? db
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
          .limit(limitPerType)
      : Promise.resolve(
          [] as Array<{
            id: number;
            title: string;
            issnNumber: string | null;
          }>,
        ),
    wantsCopy
      ? db
          .select({
            id: copyDetailsModel.id,
            accessNumber: copyDetailsModel.accessNumber,
            isbn: copyDetailsModel.isbn,
            bookId: copyDetailsModel.bookId,
            branchId: copyDetailsModel.branchId,
          })
          .from(copyDetailsModel)
          .where(
            or(
              ilike(copyDetailsModel.accessNumber, term),
              ilike(copyDetailsModel.isbn, term),
              ilike(copyDetailsModel.rfidNumber, term),
            ),
          )
          .limit(limitPerType)
      : Promise.resolve(
          [] as Array<{
            id: number;
            accessNumber: string | null;
            isbn: string | null;
            bookId: number;
            branchId: number | null;
          }>,
        ),
    wantsArticle
      ? db
          .select({
            id: libraryArticleModel.id,
            name: libraryArticleModel.name,
          })
          .from(libraryArticleModel)
          .where(ilike(libraryArticleModel.name, term))
          .limit(limitPerType)
      : Promise.resolve([] as Array<{ id: number; name: string }>),
  ]);

  // Optional branchId filter for books + copies — applied post-query so the OR
  // predicate above stays simple. Sets are already bounded by limitPerType.
  const filteredBooks =
    branchId != null ? books.filter((b) => b.branchId === branchId) : books;
  const filteredCopies =
    branchId != null ? copies.filter((c) => c.branchId === branchId) : copies;

  const hits: UnifiedSearchHit[] = [
    ...filteredBooks.map<UnifiedSearchHit>((b) => ({
      type: "BOOK",
      id: b.id,
      title: b.title,
      subtitle: b.subTitle,
      meta: b.isbn,
    })),
    ...journals.map<UnifiedSearchHit>((j) => ({
      type: "JOURNAL",
      id: j.id,
      title: j.title,
      subtitle: null,
      meta: j.issnNumber,
    })),
    ...filteredCopies.map<UnifiedSearchHit>((c) => ({
      type: "COPY",
      id: c.id,
      title: `Copy #${c.accessNumber ?? c.id}`,
      subtitle: `Book #${c.bookId}`,
      meta: c.accessNumber,
    })),
    ...articles.map<UnifiedSearchHit>((a) => ({
      type: "ARTICLE",
      id: a.id,
      title: a.name,
      subtitle: null,
      meta: null,
    })),
  ];

  const totals = {
    books: filteredBooks.length,
    journals: journals.length,
    copies: filteredCopies.length,
    articles: articles.length,
  };

  return {
    query: trimmed,
    total: totals.books + totals.journals + totals.copies + totals.articles,
    totals,
    hits,
  };
}
