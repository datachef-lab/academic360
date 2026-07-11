CREATE TABLE IF NOT EXISTS "fee_student_receipt_numbers" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"fee_student_mapping_id_fk" integer,
	"uid" varchar(255) NOT NULL,
	"sequence" integer NOT NULL,
	"receipt_number" varchar(2555) NOT NULL,
	"challan_generated_at" timestamp with time zone,
	"is_deprecated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fee_student_receipt_numbers_receiptNumber_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "fee_student_receipt_numbers" ADD CONSTRAINT "fee_student_receipt_numbers_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "fee_student_receipt_numbers" ADD CONSTRAINT "fee_student_receipt_numbers_fee_student_mapping_id_fk_fee_student_mappings_id_fk" FOREIGN KEY ("fee_student_mapping_id_fk") REFERENCES "public"."fee_student_mappings"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fee_student_receipt_active_mapping_idx" ON "fee_student_receipt_numbers" USING btree ("fee_student_mapping_id_fk") WHERE is_deprecated = false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fee_student_receipt_student_idx" ON "fee_student_receipt_numbers" USING btree ("student_id_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fee_student_receipt_mapping_idx" ON "fee_student_receipt_numbers" USING btree ("fee_student_mapping_id_fk");--> statement-breakpoint
-- Backfill existing receipt numbers from fee_student_mappings into the new table
-- as ACTIVE rows. uid comes from the receipt-number prefix (frozen at issuance,
-- authoritative); sequence from the /NN segment. Idempotent via NOT EXISTS.
INSERT INTO "fee_student_receipt_numbers"
  ("student_id_fk", "fee_student_mapping_id_fk", "uid", "sequence", "receipt_number", "challan_generated_at", "is_deprecated")
SELECT m."student_id_fk", m."id",
       split_part(m."receipt_number", '/', 1),
       CAST((regexp_match(m."receipt_number", '^[^/]+/(\d+)'))[1] AS integer),
       m."receipt_number", m."challan_generated_at", false
FROM "fee_student_mappings" m
WHERE NULLIF(TRIM(COALESCE(m."receipt_number", '')), '') IS NOT NULL
  AND regexp_match(m."receipt_number", '^[^/]+/(\d+)') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "fee_student_receipt_numbers" r WHERE r."receipt_number" = m."receipt_number"
  );
