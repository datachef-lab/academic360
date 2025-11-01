ALTER TABLE "cu_registration_correction_requests" DROP CONSTRAINT "cu_registration_correction_requests_approved_by_fk_users_id_fk";
--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" DROP CONSTRAINT "cu_registration_correction_requests_rejected_by_fk_users_id_fk";
--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD COLUMN "physical_registration_done_by_fk" integer;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD COLUMN "physical_registration_done_at" timestamp;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD COLUMN "last_updated_by_fk" integer;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD CONSTRAINT "cu_registration_correction_requests_physical_registration_done_by_fk_users_id_fk" FOREIGN KEY ("physical_registration_done_by_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD CONSTRAINT "cu_registration_correction_requests_last_updated_by_fk_users_id_fk" FOREIGN KEY ("last_updated_by_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" DROP COLUMN "approved_by_fk";--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" DROP COLUMN "approved_at";--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" DROP COLUMN "approved_remarks";--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" DROP COLUMN "rejected_by_fk";--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" DROP COLUMN "rejected_at";--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" DROP COLUMN "rejected_remarks";