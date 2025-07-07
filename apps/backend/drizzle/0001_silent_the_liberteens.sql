ALTER TABLE "instalments" ALTER COLUMN "start_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "instalments" ALTER COLUMN "end_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "instalments" ALTER COLUMN "online_start_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "instalments" ALTER COLUMN "online_end_date" DROP NOT NULL;