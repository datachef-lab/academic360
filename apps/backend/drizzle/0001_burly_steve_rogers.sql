ALTER TABLE "papers" DROP CONSTRAINT "papers_academic_year_id_fk_academic_years_id_fk";
--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "session_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" DROP COLUMN "academic_year_id_fk";