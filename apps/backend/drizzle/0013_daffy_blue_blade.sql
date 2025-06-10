ALTER TYPE "public"."subject_status" ADD VALUE 'AB' BEFORE 'P';--> statement-breakpoint
ALTER TABLE "guardians" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "parent_details" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "guardians" CASCADE;--> statement-breakpoint
DROP TABLE "parent_details" CASCADE;--> statement-breakpoint
ALTER TABLE "batch_papers" DROP CONSTRAINT "batch_papers_paper_id_fk_papers_id_fk";
--> statement-breakpoint
ALTER TABLE "batch_papers" ADD COLUMN "subject_metadata_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_identifiers" ADD COLUMN "course_id_fk" integer;--> statement-breakpoint
ALTER TABLE "batch_papers" ADD CONSTRAINT "batch_papers_subject_metadata_id_fk_subject_metadatas_id_fk" FOREIGN KEY ("subject_metadata_id_fk") REFERENCES "public"."subject_metadatas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_identifiers" ADD CONSTRAINT "academic_identifiers_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_papers" DROP COLUMN "paper_id_fk";