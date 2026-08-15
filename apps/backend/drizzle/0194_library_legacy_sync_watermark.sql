CREATE TABLE IF NOT EXISTS "library_legacy_sync_watermark" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" varchar(128) NOT NULL,
	"row_id" integer NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "library_legacy_sync_watermark_table_row_unique" ON "library_legacy_sync_watermark" ("table_name","row_id");
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'books', "id", COALESCE("updated_at", now())
FROM "books"
WHERE "legacy_books_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'copy_details', "id", COALESCE("updated_at", now())
FROM "copy_details"
WHERE "legacy_copy_details_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'journals', "id", COALESCE("updated_at", now())
FROM "journals"
WHERE "legacy_journal_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'book_circulation', "id", COALESCE("updated_at", now())
FROM "book_circulation"
WHERE "legacy_book_circulation_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'series', "id", COALESCE("updated_at", now())
FROM "series"
WHERE "legacy_series_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'enclosures', "id", COALESCE("updated_at", now())
FROM "enclosures"
WHERE "legacy_enclosure_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'entry_modes', "id", COALESCE("updated_at", now())
FROM "entry_modes"
WHERE "legacy_entry_mode_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'journal_types', "id", COALESCE("updated_at", now())
FROM "journal_types"
WHERE "legacy_journal_type_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'library_statuses', "id", COALESCE("updated_at", now())
FROM "library_statuses"
WHERE "legacy_status_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'racks', "id", COALESCE("updated_at", now())
FROM "racks"
WHERE "legacy_rack_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'shelfs', "id", COALESCE("updated_at", now())
FROM "shelfs"
WHERE "legacy_shelf_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'binding_types', "id", COALESCE("updated_at", now())
FROM "binding_types"
WHERE "legacy_binding_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'library_periods', "id", COALESCE("updated_at", now())
FROM "library_periods"
WHERE "legacy_library_period_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'author_types', "id", COALESCE("updated_at", now())
FROM "author_types"
WHERE "legacy_author_type_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'authors', "id", COALESCE("updated_at", now())
FROM "authors"
WHERE "legacy_author_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'author_details', "id", COALESCE("updated_at", now())
FROM "author_details"
WHERE "legacy_author_details_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'holidays', "id", COALESCE("updated_at", now())
FROM "holidays"
WHERE "legacy_holiday_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'class_holidays', "id", COALESCE("updated_at", now())
FROM "class_holidays"
WHERE "legacy_holiday_student_mapping_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'library_articles', "id", COALESCE("updated_at", now())
FROM "library_articles"
WHERE "legacy_library_article_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'library_document_types', "id", COALESCE("updated_at", now())
FROM "library_document_types"
WHERE "legacy_library_document_type_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'borrowing_types', "id", COALESCE("updated_at", now())
FROM "borrowing_types"
WHERE "legacy_borrowing_type_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'publishers', "id", COALESCE("updated_at", now())
FROM "publishers"
WHERE "legacy_publisher_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "library_legacy_sync_watermark" ("table_name","row_id","synced_at")
SELECT 'vendors', "id", COALESCE("updated_at", now())
FROM "vendors"
WHERE "legacy_vendor_id" IS NOT NULL
ON CONFLICT ("table_name","row_id") DO NOTHING;
