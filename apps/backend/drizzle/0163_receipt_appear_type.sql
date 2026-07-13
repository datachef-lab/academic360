-- Adds receipt_types.appear_type_promotion_status_id_fk (new) and reconciles the
-- drift drizzle-kit re-emits because its snapshots were frozen at 0153 (so it
-- can't see that 0154-0162 already applied the id-card / quota / best-of-five /
-- etc. changes). Every statement is idempotent: a no-op where already applied
-- (all of it, on prod/develop) and only creating what's genuinely missing.
ALTER TYPE "public"."id_card_field_key" ADD VALUE IF NOT EXISTS 'SHIFT';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admission_quota_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_name" varchar(255),
	"print_on_id_card" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admission_quota_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD COLUMN IF NOT EXISTS "best_of_five" double precision;--> statement-breakpoint
ALTER TABLE "receipt_types" ADD COLUMN IF NOT EXISTS "appear_type_promotion_status_id_fk" integer;--> statement-breakpoint
ALTER TABLE "copy_details" ADD COLUMN IF NOT EXISTS "author_type_id_fk" integer;--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN IF NOT EXISTS "published_year" varchar(255);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "quota_type_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "copy_details_id_fk" integer;--> statement-breakpoint
ALTER TABLE "id_card_templates" ADD COLUMN IF NOT EXISTS "qrcode_height" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "id_card_template_fields" ADD COLUMN IF NOT EXISTS "align" varchar(10) DEFAULT 'LEFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD COLUMN IF NOT EXISTS "legacy_issue_id" bigint;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "receipt_types" ADD CONSTRAINT "receipt_types_appear_type_promotion_status_id_fk_promotion_status_id_fk" FOREIGN KEY ("appear_type_promotion_status_id_fk") REFERENCES "public"."promotion_status"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_author_type_id_fk_author_types_id_fk" FOREIGN KEY ("author_type_id_fk") REFERENCES "public"."author_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "students" ADD CONSTRAINT "students_quota_type_id_fk_admission_quota_types_id_fk" FOREIGN KEY ("quota_type_id_fk") REFERENCES "public"."admission_quota_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "address" ADD CONSTRAINT "address_copy_details_id_fk_copy_details_id_fk" FOREIGN KEY ("copy_details_id_fk") REFERENCES "public"."copy_details"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_legacy_issue_id_unique" UNIQUE("legacy_issue_id");
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL;
END $$;--> statement-breakpoint
-- Backfill: categorize receipt types by appear type so the student console can
-- gate fee cards. "Casual Fees" -> Casual; everything else -> Regular. Only fills
-- rows still NULL (preserves admin edits + safe on re-run). If a DB lacks the
-- Regular/Casual promotion_status rows, nothing matches and the column stays NULL
-- (consumers treat NULL as Regular), so this is safe everywhere.
UPDATE "receipt_types" rt
SET "appear_type_promotion_status_id_fk" = ps.id
FROM "promotion_status" ps
WHERE rt."appear_type_promotion_status_id_fk" IS NULL
  AND ps."name" = CASE WHEN lower(trim(rt."name")) = 'casual fees' THEN 'Casual' ELSE 'Regular' END;
