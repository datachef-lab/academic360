-- Library circulation-policy enforcement: fine ledger + settings + title-level
-- item categories. Whole file is idempotent (house doctrine: survives a
-- re-stamp/re-run without error), and the data backfill only ever fills NULLs.
CREATE TABLE IF NOT EXISTS "library_fine_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_circulation_id_fk" integer NOT NULL,
	"user_id_fk" integer NOT NULL,
	"policy_id_fk" integer,
	"fine_per_day_snapshot" double precision DEFAULT 0 NOT NULL,
	"accrued_from" timestamp with time zone,
	"accrued_upto" timestamp with time zone,
	"billable_days" integer DEFAULT 0 NOT NULL,
	"fine_amount" double precision DEFAULT 0 NOT NULL,
	"waived_amount" double precision DEFAULT 0 NOT NULL,
	"waived_by_user_id_fk" integer,
	"waived_at" timestamp with time zone,
	"waiver_remarks" varchar(1000),
	"amount_paid" double precision DEFAULT 0 NOT NULL,
	"payment_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "library_fine_mappings_book_circulation_id_fk_unique" UNIQUE("book_circulation_id_fk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "library_fine_settings" (
	"only_row" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"accrual_go_live_date" timestamp with time zone DEFAULT now() NOT NULL,
	"running" boolean DEFAULT false NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_duration_ms" integer,
	"last_processed" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "library_fine_settings_only_row_check" CHECK (only_row = true)
);
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "item_category_id_fk" integer;--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN IF NOT EXISTS "item_category_id_fk" integer;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "library_fine_mappings" ADD CONSTRAINT "library_fine_mappings_book_circulation_id_fk_book_circulation_id_fk" FOREIGN KEY ("book_circulation_id_fk") REFERENCES "public"."book_circulation"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "library_fine_mappings" ADD CONSTRAINT "library_fine_mappings_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "library_fine_mappings" ADD CONSTRAINT "library_fine_mappings_policy_id_fk_library_circulation_policies_id_fk" FOREIGN KEY ("policy_id_fk") REFERENCES "public"."library_circulation_policies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "library_fine_mappings" ADD CONSTRAINT "library_fine_mappings_waived_by_user_id_fk_users_id_fk" FOREIGN KEY ("waived_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "library_fine_mappings" ADD CONSTRAINT "library_fine_mappings_payment_id_fk_payments_id_fk" FOREIGN KEY ("payment_id_fk") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "books" ADD CONSTRAINT "books_item_category_id_fk_library_item_categories_id_fk" FOREIGN KEY ("item_category_id_fk") REFERENCES "public"."library_item_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "journals" ADD CONSTRAINT "journals_item_category_id_fk_library_item_categories_id_fk" FOREIGN KEY ("item_category_id_fk") REFERENCES "public"."library_item_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
-- Seed the single settings row. accrual_go_live_date defaults to now(), i.e.
-- the moment this migration applies in each environment: overdue days before
-- go-live are forgiven by design (Harsh, 2026-08-14).
INSERT INTO "library_fine_settings" ("only_row") VALUES (true) ON CONFLICT ("only_row") DO NOTHING;--> statement-breakpoint
-- Backfill title-level item categories from legacy per-copy `type` text.
-- Only exact name matches are mapped (no invented mappings): 'Text Book' ->
-- TEXTBOOK, 'Reference' -> REFERENCE. A title gets a category only when every
-- typed copy maps uniformly (min=max over non-null, non-'0' types); the ~69
-- mixed-type titles stay NULL here and are covered per-copy below.
WITH book_types AS (
  SELECT book_id_fk AS book_id, min(type) AS min_type, max(type) AS max_type
  FROM copy_details
  WHERE type IS NOT NULL AND type <> '0'
  GROUP BY book_id_fk
)
UPDATE books b
SET item_category_id_fk = ic.id
FROM book_types bt
JOIN library_item_categories ic
  ON ic.code = CASE bt.min_type WHEN 'Text Book' THEN 'TEXTBOOK' WHEN 'Reference' THEN 'REFERENCE' END
WHERE b.id = bt.book_id
  AND bt.min_type = bt.max_type
  AND b.item_category_id_fk IS NULL;--> statement-breakpoint
-- Per-copy override, only for copies of mixed-type titles whose own mapped
-- category differs from (or is missing on) the title. Uniform titles are
-- governed by the books row and keep copy-level NULL.
UPDATE copy_details cd
SET item_category_id_fk = ic.id
FROM books b, library_item_categories ic
WHERE cd.book_id_fk = b.id
  AND cd.item_category_id_fk IS NULL
  AND ic.code = CASE cd.type WHEN 'Text Book' THEN 'TEXTBOOK' WHEN 'Reference' THEN 'REFERENCE' END
  AND b.item_category_id_fk IS DISTINCT FROM ic.id
  AND EXISTS (
    SELECT 1 FROM copy_details cd2
    WHERE cd2.book_id_fk = cd.book_id_fk
      AND cd2.type IS NOT NULL AND cd2.type <> '0'
      AND cd2.type <> cd.type
  );--> statement-breakpoint
UPDATE journals j
SET item_category_id_fk = ic.id
FROM library_item_categories ic
WHERE ic.code = 'JOURNAL' AND j.item_category_id_fk IS NULL;
