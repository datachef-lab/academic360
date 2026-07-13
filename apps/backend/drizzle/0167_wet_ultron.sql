ALTER TABLE "receipt_types" ADD COLUMN IF NOT EXISTS "appear_type_promotion_status_id_fk" integer;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "receipt_types" ADD CONSTRAINT "receipt_types_appear_type_promotion_status_id_fk_promotion_status_id_fk" FOREIGN KEY ("appear_type_promotion_status_id_fk") REFERENCES "public"."promotion_status"("id") ON DELETE no action ON UPDATE no action;
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
