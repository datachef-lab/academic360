-- Guarded throughout: this migration's `when` was bumped past main's last
-- applied migration so prod actually runs it (ADR 0028 silent-skip trap);
-- databases that already applied it under the original timestamp (develop)
-- will re-run it, so every statement must be a no-op the second time.
ALTER TYPE "public"."subject_selection_option_source" ADD VALUE IF NOT EXISTS 'SUBJECT_GROUP';--> statement-breakpoint
ALTER TABLE "student_subject_selections" ALTER COLUMN "subject_id_fk" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD COLUMN IF NOT EXISTS "subject_grouping_main_id_fk" integer;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_subject_grouping_main_id_fk_subject_grouping_main_id_fk" FOREIGN KEY ("subject_grouping_main_id_fk") REFERENCES "public"."subject_grouping_main"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_subject_selections_subject_group_id_idx" ON "student_subject_selections" USING btree ("subject_grouping_main_id_fk");--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_subject_xor_group_check" CHECK (("student_subject_selections"."subject_id_fk" IS NOT NULL AND "student_subject_selections"."subject_grouping_main_id_fk" IS NULL)
         OR ("student_subject_selections"."subject_id_fk" IS NULL AND "student_subject_selections"."subject_grouping_main_id_fk" IS NOT NULL));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
