ALTER TABLE "students" ALTER COLUMN "uid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_uid_unique" UNIQUE("uid");
