-- Repair for eight migrations drizzle silently skipped.
--
-- WHY THEY WERE SKIPPED. `drizzle-kit migrate` does not track migrations
-- individually. From drizzle-orm/pg-core/dialect.cjs:
--
--     select id, hash, created_at from __drizzle_migrations
--       order by created_at desc limit 1
--     ...
--     if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis)
--
-- It reads the ONE latest applied timestamp and applies only migrations whose
-- `when` is greater. So if a database ever runs a migration with a large `when`
-- before an older one arrives (a branch merged out of order), every entry with
-- a smaller `when` becomes permanently unreachable — applied never, reported
-- never. On the develop database this left 8 entries unapplied:
--
--   0142_next_payback     0143_reflective_sauron  0144_burly_silverclaw
--   0145_medical_proudstar 0163_subject_grouping_previous_fk
--   0164_realtime_tracker_indexes 0165_mixed_multiple_man 0166_brainy_meteorite
--
-- WHAT IS ACTUALLY MISSING. Most of their objects exist already — 0163/0164/
-- 0165/0166 were written with IF NOT EXISTS / DO $$ guards and their objects
-- were created by other means. Verified object by object against the develop
-- database, only three things are genuinely absent:
--
--   * "holidays"                  (0142)
--   * "class_holidays"            (0142)
--   * "copy_details"."vendor_id_fk" + its FK (0145)
--
-- and those three are exactly what the library IRP loader writes to, which is
-- why loading holidays / class holidays / copy details failed.
--
-- Everything below is idempotent: on a fresh database (where the eight DO run,
-- in order) this migration is a no-op, and on develop it closes the gap.

-- NOTE the column name: 0142 created "legacy_holidays_id" and 0143 (a one-line
-- file, easy to miss) renamed it to "legacy_holiday_id", which is what
-- holiday.model.ts declares and what every query uses. Create it under the
-- POST-rename name, and rename it on any database that still holds the old one.
CREATE TABLE IF NOT EXISTS "holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_holiday_id" integer,
	"name" varchar(1000) NOT NULL,
	"short_name" varchar(1000),
	"from" date NOT NULL,
	"to" date NOT NULL,
	"remarks" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "class_holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_holiday_student_mapping_id" integer,
	"holiday_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"is_holiday" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "class_holidays" ADD CONSTRAINT "class_holidays_holiday_id_fk_holidays_id_fk"
    FOREIGN KEY ("holiday_id_fk") REFERENCES "public"."holidays"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "class_holidays" ADD CONSTRAINT "class_holidays_program_course_id_fk_program_courses_id_fk"
    FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "class_holidays" ADD CONSTRAINT "class_holidays_class_id_fk_classes_id_fk"
    FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

-- 0145: the loader stamps a copy's supplier, so this column has to exist before
-- copydetailsub can load.
ALTER TABLE "copy_details" ADD COLUMN IF NOT EXISTS "vendor_id_fk" integer;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_vendor_id_fk_vendors_id_fk"
    FOREIGN KEY ("vendor_id_fk") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

-- 0144 / 0142 defensively: these exist on develop, but a database that skipped
-- the same entries for a different reason would still be missing them.
CREATE TABLE IF NOT EXISTS "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_vendor_id" integer,
	"name" varchar(1000) NOT NULL,
	"code" varchar(500),
	"email" varchar(500),
	"phone" varchar(15),
	"website" varchar(5000),
	"person_of_contact" varchar(1000),
	"person_of_contact_email" varchar(500),
	"person_of_contact_phone" varchar(15),
	"pan" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "vendor_id_fk" integer;--> statement-breakpoint

-- 0143, for a database that has "holidays" from 0142 but never got the rename.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'holidays' AND column_name = 'legacy_holidays_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'holidays' AND column_name = 'legacy_holiday_id')
  THEN
    ALTER TABLE "holidays" RENAME COLUMN "legacy_holidays_id" TO "legacy_holiday_id";
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "address" ADD CONSTRAINT "address_vendor_id_fk_vendors_id_fk"
    FOREIGN KEY ("vendor_id_fk") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
