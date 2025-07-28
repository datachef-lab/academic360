ALTER TABLE "program_courses" DROP CONSTRAINT "program_courses_affiliation_type_id_fk_affiliation_types_id_fk";
--> statement-breakpoint
ALTER TABLE "program_courses" ADD COLUMN "affiliation_id_fk" integer;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_affiliation_id_fk_affiliations_id_fk" FOREIGN KEY ("affiliation_id_fk") REFERENCES "public"."affiliations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" DROP COLUMN "affiliation_type_id_fk";