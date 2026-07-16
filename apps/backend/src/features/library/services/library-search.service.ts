import { db } from "@/db/index.js";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { bookModel } from "@repo/db/schemas/models/library/book.model.js";
import { journalModel } from "@repo/db/schemas/models/library/journal.model.js";
import { copyDetailsModel } from "@repo/db/schemas/models/library/copy-details.model.js";
import { libraryArticleModel } from "@repo/db/schemas/models/library/library-article.model.js";
import { authorModel } from "@repo/db/schemas/models/library/author.model.js";
import { authorDetailsModel } from "@repo/db/schemas/models/library/author-detail.model.js";
import { publisherModel } from "@repo/db/schemas/models/library/publisher.model.js";
import { rackModel } from "@repo/db/schemas/models/library/rack.model.js";
import { shelfModel } from "@repo/db/schemas/models/library/shelf.model.js";
import { statusModel } from "@repo/db/schemas/models/library/status.model.js";
import { bindingModel } from "@repo/db/schemas/models/library/binding.model.js";
import { languageMediumModel } from "@repo/db/schemas/models/resources/languageMedium.model.js";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";

export type UnifiedSearchType = "BOOK" | "JOURNAL" | "COPY" | "ARTICLE";

export type UnifiedSearchHit = {
  type: UnifiedSearchType;
  id: number;
  title: string;
  subtitle: string | null;
  meta: string | null;
  // OPAC display fields (book-backed; null for journals/articles without a book)
  author: string | null;
  publisher: string | null;
  edition: string | null;
  language: string | null;
  quantity: number | null;
  rack: string | null;
  shelf: string | null;
  status: string | null;
  nextAvailableDate: string | null;
};

/** Per-book aggregates used to fill the OPAC display columns. */
type BookEnrichment = {
  author: string | null;
  publisher: string | null;
  edition: string | null;
  language: string | null;
  quantity: number;
  rack: string | null;
  shelf: string | null;
  status: string;
  nextAvailableDate: string | null;
};

const joinNames = (names: (string | null)[]): string | null => {
  const uniq = Array.from(
    new Set(names.filter((n): n is string => !!n && n.trim() !== "")),
  );
  return uniq.length ? uniq.join(", ") : null;
};

/** Raw per-book copy/author/loan rows used to derive the OPAC columns. */
type CopyAgg = {
  authors: string[];
  copies: { rack: string | null; shelf: string | null }[];
  dueDates: Date[];
};

/** Fetches authors, copies (rack/shelf) and active-loan due dates grouped by book id. */
async function fetchCopyAggregates(
  bookIds: number[],
): Promise<Map<number, CopyAgg>> {
  const map = new Map<number, CopyAgg>();
  if (bookIds.length === 0) return map;
  const ensure = (id: number): CopyAgg => {
    let v = map.get(id);
    if (!v) {
      v = { authors: [], copies: [], dueDates: [] };
      map.set(id, v);
    }
    return v;
  };

  const [authorRows, copyRows, loanRows] = await Promise.all([
    db
      .select({ bookId: authorDetailsModel.bookId, name: authorModel.name })
      .from(authorDetailsModel)
      .leftJoin(authorModel, eq(authorDetailsModel.authorId, authorModel.id))
      .where(inArray(authorDetailsModel.bookId, bookIds)),
    db
      .select({
        bookId: copyDetailsModel.bookId,
        rack: rackModel.name,
        shelf: shelfModel.name,
      })
      .from(copyDetailsModel)
      .leftJoin(rackModel, eq(copyDetailsModel.rackId, rackModel.id))
      .leftJoin(shelfModel, eq(copyDetailsModel.shelfId, shelfModel.id))
      .where(inArray(copyDetailsModel.bookId, bookIds)),
    db
      .select({
        bookId: copyDetailsModel.bookId,
        returnTimestamp: bookCirculationModel.returnTimestamp,
      })
      .from(bookCirculationModel)
      .innerJoin(
        copyDetailsModel,
        eq(bookCirculationModel.copyDetailsId, copyDetailsModel.id),
      )
      .where(
        and(
          inArray(copyDetailsModel.bookId, bookIds),
          eq(bookCirculationModel.isReturned, false),
        ),
      ),
  ]);

  for (const a of authorRows)
    if (a.name != null) ensure(a.bookId).authors.push(a.name);
  for (const c of copyRows)
    ensure(c.bookId).copies.push({ rack: c.rack, shelf: c.shelf });
  for (const l of loanRows)
    if (l.returnTimestamp)
      ensure(l.bookId).dueDates.push(
        new Date(l.returnTimestamp as unknown as string),
      );
  return map;
}

/** Collapses one or more per-book aggregates + edition/publisher into display columns. */
function summarize(
  aggs: CopyAgg[],
  meta: {
    edition: string | null;
    publisher: string | null;
    language: string | null;
  },
): BookEnrichment {
  const authors: string[] = [];
  const copies: { rack: string | null; shelf: string | null }[] = [];
  const dueDates: Date[] = [];
  for (const a of aggs) {
    authors.push(...a.authors);
    copies.push(...a.copies);
    dueDates.push(...a.dueDates);
  }
  const quantity = copies.length;
  const availableCount = Math.max(0, quantity - dueDates.length);
  const earliest = dueDates.length
    ? new Date(Math.min(...dueDates.map((d) => d.getTime())))
    : null;
  return {
    author: joinNames(authors),
    publisher: meta.publisher,
    edition: meta.edition,
    language: meta.language,
    quantity,
    rack: joinNames(copies.map((c) => c.rack)),
    shelf: joinNames(copies.map((c) => c.shelf)),
    status:
      quantity === 0
        ? "No copies"
        : availableCount > 0
          ? "Available"
          : "Issued",
    nextAvailableDate:
      availableCount > 0 || !earliest
        ? null
        : earliest.toISOString().slice(0, 10),
  };
}

/** OPAC enrichment for book/article hits, keyed by book id. */
async function buildBookEnrichment(
  bookIds: number[],
): Promise<Map<number, BookEnrichment>> {
  const map = new Map<number, BookEnrichment>();
  if (bookIds.length === 0) return map;
  const [bookRows, aggregates] = await Promise.all([
    db
      .select({
        id: bookModel.id,
        edition: bookModel.edition,
        publisher: publisherModel.name,
        language: languageMediumModel.name,
      })
      .from(bookModel)
      .leftJoin(publisherModel, eq(bookModel.publisherId, publisherModel.id))
      .leftJoin(
        languageMediumModel,
        eq(bookModel.languageId, languageMediumModel.id),
      )
      .where(inArray(bookModel.id, bookIds)),
    fetchCopyAggregates(bookIds),
  ]);
  for (const b of bookRows) {
    const agg = aggregates.get(b.id);
    map.set(
      b.id,
      summarize(agg ? [agg] : [], {
        edition: b.edition ?? null,
        publisher: b.publisher ?? null,
        language: b.language ?? null,
      }),
    );
  }
  return map;
}

/**
 * OPAC enrichment for journal hits, keyed by journal id. A journal's physical
 * holdings live on the books linked to it (book.journalId), so we aggregate the
 * copies of all linked books and take the publisher from the journal master.
 */
async function buildJournalEnrichment(
  journalIds: number[],
): Promise<Map<number, BookEnrichment>> {
  const map = new Map<number, BookEnrichment>();
  if (journalIds.length === 0) return map;

  const [journalRows, linkRows] = await Promise.all([
    db
      .select({
        id: journalModel.id,
        publisher: publisherModel.name,
        language: languageMediumModel.name,
      })
      .from(journalModel)
      .leftJoin(publisherModel, eq(journalModel.publisherId, publisherModel.id))
      .leftJoin(
        languageMediumModel,
        eq(journalModel.languageId, languageMediumModel.id),
      )
      .where(inArray(journalModel.id, journalIds)),
    db
      .select({
        bookId: bookModel.id,
        journalId: bookModel.journalId,
        edition: bookModel.edition,
      })
      .from(bookModel)
      .where(inArray(bookModel.journalId, journalIds)),
  ]);

  const booksByJournal = new Map<
    number,
    { bookId: number; edition: string | null }[]
  >();
  for (const l of linkRows) {
    if (l.journalId == null) continue;
    const arr = booksByJournal.get(l.journalId) ?? [];
    arr.push({ bookId: l.bookId, edition: l.edition });
    booksByJournal.set(l.journalId, arr);
  }
  const allBookIds = linkRows.map((l) => l.bookId);
  const aggregates = await fetchCopyAggregates(allBookIds);

  for (const j of journalRows) {
    const linked = booksByJournal.get(j.id) ?? [];
    const aggs = linked
      .map((b) => aggregates.get(b.bookId))
      .filter((a): a is CopyAgg => a != null);
    const edition =
      linked.find((b) => b.edition && b.edition.trim() !== "")?.edition ?? null;
    map.set(
      j.id,
      summarize(aggs, {
        edition,
        publisher: j.publisher ?? null,
        language: j.language ?? null,
      }),
    );
  }
  return map;
}

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

/** A single physical copy as shown in the OPAC details (legacy "Copy Details") table. */
export type OpacCopyRow = {
  id: number;
  accessNumber: string | null;
  oldAccessNumber: string | null;
  status: string | null;
  availableDate: string | null; // due date when on an open loan; null = on shelf
  copyType: string | null;
  binding: string | null;
  rack: string | null;
  shelf: string | null;
};

/** Resolves the holdings (copies) of a catalogue item for the OPAC details view. */
export async function getOpacCopies(
  type: UnifiedSearchType,
  id: number,
): Promise<OpacCopyRow[]> {
  // Resolve which books' copies to show.
  let bookIds: number[] = [];
  if (type === "BOOK") {
    bookIds = [id];
  } else if (type === "COPY") {
    const [c] = await db
      .select({ bookId: copyDetailsModel.bookId })
      .from(copyDetailsModel)
      .where(eq(copyDetailsModel.id, id));
    if (c) bookIds = [c.bookId];
  } else if (type === "JOURNAL") {
    const bks = await db
      .select({ id: bookModel.id })
      .from(bookModel)
      .where(eq(bookModel.journalId, id));
    bookIds = bks.map((b) => b.id);
  }
  if (bookIds.length === 0) return [];

  const rows = await db
    .select({
      id: copyDetailsModel.id,
      accessNumber: copyDetailsModel.accessNumber,
      oldAccessNumber: copyDetailsModel.oldAccessNumber,
      copyType: copyDetailsModel.type,
      status: statusModel.name,
      binding: bindingModel.name,
      rack: rackModel.name,
      shelf: shelfModel.name,
    })
    .from(copyDetailsModel)
    .leftJoin(statusModel, eq(copyDetailsModel.statusId, statusModel.id))
    .leftJoin(bindingModel, eq(copyDetailsModel.bindingTypeId, bindingModel.id))
    .leftJoin(rackModel, eq(copyDetailsModel.rackId, rackModel.id))
    .leftJoin(shelfModel, eq(copyDetailsModel.shelfId, shelfModel.id))
    .where(inArray(copyDetailsModel.bookId, bookIds));

  const copyIds = rows.map((r) => r.id);
  const loanRows = copyIds.length
    ? await db
        .select({
          copyId: bookCirculationModel.copyDetailsId,
          due: bookCirculationModel.returnTimestamp,
        })
        .from(bookCirculationModel)
        .where(
          and(
            inArray(bookCirculationModel.copyDetailsId, copyIds),
            eq(bookCirculationModel.isReturned, false),
          ),
        )
    : [];
  const dueByCopy = new Map<number, Date>();
  for (const l of loanRows) {
    if (!l.due) continue;
    const d = new Date(l.due as unknown as string);
    const ex = dueByCopy.get(l.copyId);
    if (!ex || d < ex) dueByCopy.set(l.copyId, d);
  }

  return rows.map((r) => {
    const due = dueByCopy.get(r.id);
    return {
      id: r.id,
      accessNumber: r.accessNumber,
      oldAccessNumber: r.oldAccessNumber,
      status: r.status,
      availableDate: due ? due.toISOString().slice(0, 10) : null,
      copyType: r.copyType,
      binding: r.binding,
      rack: r.rack,
      shelf: r.shelf,
    };
  });
}

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
  // NULL-branch rows are treated as global/unassigned and always included
  // (most catalogue rows have no branch yet).
  const filteredBooks =
    branchId != null
      ? books.filter((b) => b.branchId === branchId || b.branchId == null)
      : books;
  const filteredCopies =
    branchId != null
      ? copies.filter((c) => c.branchId === branchId || c.branchId == null)
      : copies;

  // Enrich book-backed hits (books + copies) with the OPAC display columns.
  const enrichBookIds = Array.from(
    new Set([
      ...filteredBooks.map((b) => b.id),
      ...filteredCopies.map((c) => c.bookId),
    ]),
  );
  const [enrichment, journalEnrichment] = await Promise.all([
    buildBookEnrichment(enrichBookIds),
    buildJournalEnrichment(journals.map((j) => j.id)),
  ]);
  const emptyEnrichment = {
    author: null,
    publisher: null,
    edition: null,
    language: null,
    quantity: null,
    rack: null,
    shelf: null,
    status: null,
    nextAvailableDate: null,
  } as const;

  const hits: UnifiedSearchHit[] = [
    ...filteredBooks.map<UnifiedSearchHit>((b) => ({
      type: "BOOK",
      id: b.id,
      title: b.title,
      subtitle: b.subTitle,
      meta: b.isbn,
      ...emptyEnrichment,
      ...(enrichment.get(b.id) ?? {}),
    })),
    ...journals.map<UnifiedSearchHit>((j) => ({
      type: "JOURNAL",
      id: j.id,
      title: j.title,
      subtitle: null,
      meta: j.issnNumber,
      ...emptyEnrichment,
      ...(journalEnrichment.get(j.id) ?? {}),
    })),
    ...filteredCopies.map<UnifiedSearchHit>((c) => {
      const e = enrichment.get(c.bookId);
      return {
        type: "COPY",
        id: c.id,
        title: `Copy #${c.accessNumber ?? c.id}`,
        subtitle: `Book #${c.bookId}`,
        meta: c.accessNumber,
        ...emptyEnrichment,
        ...(e ?? {}),
      };
    }),
    ...articles.map<UnifiedSearchHit>((a) => ({
      type: "ARTICLE",
      id: a.id,
      title: a.name,
      subtitle: null,
      meta: null,
      ...emptyEnrichment,
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
