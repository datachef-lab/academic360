/**
 * Legacy-table → new-table mapping shared by the boot loader
 * (`old-irp-data.ts`) and the delta-sync service
 * (`library-legacy-sync.service.ts`).
 *
 * Kept in its own file so neither of the two callers has to import the other
 * (a circular import surfaced the first time this lived in the sync service).
 *
 * `legacyIdColumn` matches the Drizzle-generated snake_case: a field named
 * `legacyBooksId` on the model maps to the Postgres column `legacy_books_id`.
 * Verified against `packages/db/src/schemas/models/library`.
 *
 * `deletePriority` mirrors the loader's `LOAD_LAYERS` reversed — leaves first
 * (lowest priority) so a delete pass takes children before their parents.
 * Upserts and skip-lookups don't care about priority; only the sync's delete
 * pass uses it.
 */
export type LibraryLegacyMapping = {
  legacyTable: string;
  newTable: string;
  legacyIdColumn: string;
  deletePriority: number;
};

export const LIBRARY_LEGACY_MAP: LibraryLegacyMapping[] = [
  // Leaves — nothing else in this map references them.
  {
    legacyTable: "issuereturn",
    newTable: "book_circulation",
    legacyIdColumn: "legacy_book_circulation_id",
    deletePriority: 1,
  },
  {
    legacyTable: "libentryexit",
    newTable: "library_entry_exit",
    legacyIdColumn: "legacy_library_entry_exit_id",
    deletePriority: 1,
  },
  {
    legacyTable: "holidaystudentsub",
    newTable: "class_holidays",
    legacyIdColumn: "legacy_holiday_student_mapping_id",
    deletePriority: 1,
  },
  {
    legacyTable: "authordetailsub",
    newTable: "author_details",
    legacyIdColumn: "legacy_author_details_id",
    deletePriority: 1,
  },
  // Referenced by the leaves.
  {
    legacyTable: "copydetailsub",
    newTable: "copy_details",
    legacyIdColumn: "legacy_copy_details_id",
    deletePriority: 2,
  },
  {
    legacyTable: "holidaymain",
    newTable: "holidays",
    legacyIdColumn: "legacy_holiday_id",
    deletePriority: 2,
  },
  {
    legacyTable: "journalmaster",
    newTable: "journals",
    legacyIdColumn: "legacy_journal_id",
    deletePriority: 2,
  },
  // Referenced by copies + journals.
  {
    legacyTable: "bookentry",
    newTable: "books",
    legacyIdColumn: "legacy_books_id",
    deletePriority: 3,
  },
  // Masters. Referenced widely — deleted last so parents survive until every
  // downstream row is gone.
  {
    legacyTable: "author",
    newTable: "authors",
    legacyIdColumn: "legacy_author_id",
    deletePriority: 4,
  },
  {
    legacyTable: "authortype",
    newTable: "author_types",
    legacyIdColumn: "legacy_author_type_id",
    deletePriority: 4,
  },
  {
    legacyTable: "procurementvendordetailmaintab",
    newTable: "vendors",
    legacyIdColumn: "legacy_vendor_id",
    deletePriority: 4,
  },
  {
    legacyTable: "publisher",
    newTable: "publishers",
    legacyIdColumn: "legacy_publisher_id",
    deletePriority: 4,
  },
  {
    legacyTable: "series",
    newTable: "series",
    legacyIdColumn: "legacy_series_id",
    deletePriority: 4,
  },
  {
    legacyTable: "rack",
    newTable: "racks",
    legacyIdColumn: "legacy_rack_id",
    deletePriority: 4,
  },
  {
    legacyTable: "shelf",
    newTable: "shelfs",
    legacyIdColumn: "legacy_shelf_id",
    deletePriority: 4,
  },
  {
    legacyTable: "bindingtype",
    newTable: "binding_types",
    legacyIdColumn: "legacy_binding_id",
    deletePriority: 4,
  },
  {
    legacyTable: "enclosetype",
    newTable: "enclosures",
    legacyIdColumn: "legacy_enclosure_id",
    deletePriority: 4,
  },
  {
    legacyTable: "entrymode",
    newTable: "entry_modes",
    legacyIdColumn: "legacy_entry_mode_id",
    deletePriority: 4,
  },
  {
    legacyTable: "journaltype",
    newTable: "journal_types",
    legacyIdColumn: "legacy_journal_type_id",
    deletePriority: 4,
  },
  {
    legacyTable: "status",
    newTable: "library_statuses",
    legacyIdColumn: "legacy_status_id",
    deletePriority: 4,
  },
  {
    legacyTable: "periodpojo",
    newTable: "library_periods",
    legacyIdColumn: "legacy_library_period_id",
    deletePriority: 4,
  },
  {
    legacyTable: "latype",
    newTable: "library_articles",
    legacyIdColumn: "legacy_library_article_id",
    deletePriority: 4,
  },
  {
    legacyTable: "documenttypelist",
    newTable: "library_document_types",
    legacyIdColumn: "legacy_library_document_type_id",
    deletePriority: 4,
  },
  {
    legacyTable: "borrowingtype",
    newTable: "borrowing_types",
    legacyIdColumn: "legacy_borrowing_type_id",
    deletePriority: 4,
  },
];

export function findLegacyMapping(
  legacyTable: string,
): LibraryLegacyMapping | null {
  return LIBRARY_LEGACY_MAP.find((m) => m.legacyTable === legacyTable) ?? null;
}
