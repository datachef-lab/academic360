ALTER TABLE "promotions" ALTER COLUMN "start_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promotions" ALTER COLUMN "end_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "date_of_joining" timestamp;