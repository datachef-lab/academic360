ALTER TABLE "fee_categories" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_groups" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_slabs" ALTER COLUMN "description" DROP NOT NULL;