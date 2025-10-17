ALTER TABLE "cu_registration_correction_requests" ADD COLUMN "aadhaar_card_number_correction_request" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "abc_id";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "apprid";