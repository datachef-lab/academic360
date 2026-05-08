ALTER TABLE "academic_activities" ALTER COLUMN "remarks" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "academic_activity_master" ADD COLUMN "remarks" varchar(1000);