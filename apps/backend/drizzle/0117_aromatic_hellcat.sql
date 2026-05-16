ALTER TABLE "fee_categories" ADD COLUMN "code" varchar(100);--> statement-breakpoint
ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_code_unique" UNIQUE("code");