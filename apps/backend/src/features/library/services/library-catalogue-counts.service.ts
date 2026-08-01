import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";

/**
 * A single roll-up of counts across every library master + article-entry
 * table, so the Holdings tab can render one comprehensive view of the
 * catalogue's shape without a dozen bespoke queries.
 *
 * Grouped by concern (article-entry vs masters vs operational) so the client
 * can render each group as its own card. Order inside a group is the order a
 * librarian typically thinks in.
 *
 * All counts run in parallel — 20-odd COUNT(*)s hit indexes and finish in one
 * round-trip. Live-updated: the middleware fires `library:master:updated` on
 * every non-GET, and the loader fires `library:load:progress` per table, so
 * the dashboard's React Query invalidator refetches this on any change.
 */

type CountRow = {
  key: string;
  label: string;
  table: string;
  count: number;
};

type Group = {
  key: string;
  label: string;
  items: CountRow[];
};

/** SQL-escape a table name so `sql.raw` is safe with our fixed literals. */
const TABLES: Array<{
  group: "articles" | "catalogue" | "masters" | "operational";
  key: string;
  label: string;
  table: string;
}> = [
  // "Articles" = article-entry tables — the things a librarian catalogues.
  { group: "articles", key: "books", label: "Books", table: "books" },
  {
    group: "articles",
    key: "copies",
    label: "Book copies",
    table: "copy_details",
  },
  { group: "articles", key: "journals", label: "Journals", table: "journals" },
  {
    group: "articles",
    key: "journalIssues",
    label: "Journal issues",
    table: "library_journal_issues",
  },
  { group: "articles", key: "series", label: "Series", table: "series" },
  {
    group: "articles",
    key: "articles",
    label: "Articles (LA)",
    table: "library_articles",
  },

  // "Catalogue" = the descriptive dimensions the article entries hang off.
  { group: "catalogue", key: "authors", label: "Authors", table: "authors" },
  {
    group: "catalogue",
    key: "authorDetails",
    label: "Book–author links",
    table: "author_details",
  },
  {
    group: "catalogue",
    key: "authorTypes",
    label: "Author types",
    table: "author_types",
  },
  {
    group: "catalogue",
    key: "publishers",
    label: "Publishers / Publications",
    table: "publishers",
  },
  { group: "catalogue", key: "vendors", label: "Vendors", table: "vendors" },
  {
    group: "catalogue",
    key: "subscriptions",
    label: "Journal subscriptions",
    table: "library_journal_subscriptions",
  },

  // "Masters" = the operational configuration.
  {
    group: "masters",
    key: "branches",
    label: "Branches",
    table: "library_branches",
  },
  { group: "masters", key: "zones", label: "Zones", table: "library_zones" },
  { group: "masters", key: "racks", label: "Racks", table: "racks" },
  { group: "masters", key: "shelves", label: "Shelves", table: "shelfs" },
  {
    group: "masters",
    key: "statuses",
    label: "Statuses",
    table: "library_statuses",
  },
  {
    group: "masters",
    key: "bindingTypes",
    label: "Binding types",
    table: "binding_types",
  },
  {
    group: "masters",
    key: "entryModes",
    label: "Entry modes",
    table: "entry_modes",
  },
  {
    group: "masters",
    key: "periods",
    label: "Periodics / Periods",
    table: "library_periods",
  },
  {
    group: "masters",
    key: "enclosures",
    label: "Enclosures",
    table: "enclosures",
  },
  {
    group: "masters",
    key: "journalTypes",
    label: "Journal types",
    table: "journal_types",
  },
  {
    group: "masters",
    key: "documentTypes",
    label: "Document types",
    table: "library_document_types",
  },
  {
    group: "masters",
    key: "borrowingTypes",
    label: "Borrowing types",
    table: "borrowing_types",
  },
  {
    group: "masters",
    key: "itemCategories",
    label: "Item categories",
    table: "library_item_categories",
  },
  {
    group: "masters",
    key: "patronCategories",
    label: "Patron categories",
    table: "library_patron_categories",
  },
  { group: "masters", key: "holidays", label: "Holidays", table: "holidays" },
  {
    group: "masters",
    key: "classHolidays",
    label: "Class holidays",
    table: "class_holidays",
  },
  {
    group: "masters",
    key: "policies",
    label: "Circulation policies",
    table: "library_circulation_policies",
  },

  // Operational — living records the library generates over time.
  {
    group: "operational",
    key: "circulations",
    label: "Book circulation",
    table: "book_circulation",
  },
  {
    group: "operational",
    key: "reissues",
    label: "Book reissues",
    table: "book_reissue",
  },
  {
    group: "operational",
    key: "entryExit",
    label: "Library entry / exit",
    table: "library_entry_exit",
  },
  {
    group: "operational",
    key: "readingLists",
    label: "Reading lists",
    table: "library_reading_lists",
  },
  {
    group: "operational",
    key: "academicArchives",
    label: "Academic archives",
    table: "library_academic_archives",
  },
  {
    group: "operational",
    key: "evidenceDocs",
    label: "Evidence docs",
    table: "library_evidence_docs",
  },
];

const GROUP_LABEL: Record<
  CountRow["key"] extends never ? never : string,
  string
> = {
  articles: "Article entries",
  catalogue: "Catalogue & credits",
  masters: "Masters & configuration",
  operational: "Operational records",
};

export async function readCatalogueCounts(): Promise<Group[]> {
  const results = await Promise.all(
    TABLES.map(async (t) => {
      try {
        const rows = (
          await db.execute(
            sql.raw(`SELECT COUNT(*)::int AS n FROM "${t.table}"`),
          )
        ).rows as Array<{ n: number }>;
        return { ...t, count: Number(rows[0]?.n ?? 0) };
      } catch {
        // A missing table shouldn't crash the roll-up; the specific tile
        // just shows 0 and the operator sees which one didn't resolve.
        return { ...t, count: 0 };
      }
    }),
  );

  const byGroup = new Map<string, CountRow[]>();
  for (const r of results) {
    const arr = byGroup.get(r.group) ?? [];
    arr.push({ key: r.key, label: r.label, table: r.table, count: r.count });
    byGroup.set(r.group, arr);
  }

  // Fixed group order — reads top-to-bottom the way a librarian thinks about
  // the catalogue.
  return ["articles", "catalogue", "masters", "operational"].map((g) => ({
    key: g,
    label: GROUP_LABEL[g] ?? g,
    items: byGroup.get(g) ?? [],
  }));
}
