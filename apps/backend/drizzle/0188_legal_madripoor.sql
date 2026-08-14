ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "academic_year_id_fk" integer;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "books" ADD CONSTRAINT "books_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
