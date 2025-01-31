ALTER TABLE "specializations" ADD COLUMN "sequence" integer;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE("name");