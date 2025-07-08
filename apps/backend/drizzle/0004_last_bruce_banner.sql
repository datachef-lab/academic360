ALTER TABLE "apps" RENAME COLUMN "icon" TO "logo";--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "college_name" varchar(700) NOT NULL;--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "college_short_name" varchar(7) NOT NULL;