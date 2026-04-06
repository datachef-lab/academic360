-- Naive timestamps were written under session Asia/Kolkata; interpret wall clock as IST before timestamptz
ALTER TABLE "payments" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING ("created_at" AT TIME ZONE 'Asia/Kolkata');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING ("updated_at" AT TIME ZONE 'Asia/Kolkata');
