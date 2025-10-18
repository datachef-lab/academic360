ALTER TABLE "cu_registration_correction_requests" ALTER COLUMN "cu_registration_application_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD COLUMN "personal_info_declaration" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD COLUMN "address_info_declaration" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD COLUMN "subjects_declaration" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD COLUMN "documents_declaration" boolean DEFAULT false NOT NULL;