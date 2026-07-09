ALTER TABLE "subject_grouping_main" ADD COLUMN IF NOT EXISTS "previous_subject_grouping_id_fk" integer;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "subject_grouping_main" ADD CONSTRAINT "subject_grouping_main_previous_subject_grouping_id_fk_subject_grouping_main_id_fk" FOREIGN KEY ("previous_subject_grouping_id_fk") REFERENCES "public"."subject_grouping_main"("id");
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
