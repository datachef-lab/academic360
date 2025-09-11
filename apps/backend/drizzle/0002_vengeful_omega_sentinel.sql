ALTER TABLE "program_courses" DROP CONSTRAINT "unique_program_course";--> statement-breakpoint
ALTER TABLE "program_courses" ADD COLUMN "short_name" varchar(500);