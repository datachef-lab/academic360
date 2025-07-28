ALTER TABLE "affiliation_types" ADD COLUMN "sequence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "affiliation_types" ADD COLUMN "disabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "affiliations" ADD COLUMN "remarks" text;--> statement-breakpoint
ALTER TABLE "program_courses" ADD COLUMN "disabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "specializations" ADD COLUMN "disabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "course_types" DROP COLUMN "code_prefix";--> statement-breakpoint
ALTER TABLE "program_courses" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "streams" DROP COLUMN "code_prefix";