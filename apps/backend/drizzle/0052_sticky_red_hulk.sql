ALTER TYPE "public"."cu_registration_correction_request_status" ADD VALUE 'RECTIFICATION_DONE';--> statement-breakpoint
ALTER TABLE "cu_physical_reg" ALTER COLUMN "submission_date" DROP NOT NULL;