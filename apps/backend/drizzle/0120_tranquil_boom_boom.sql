ALTER TYPE "public"."payment_for_type" ADD VALUE 'ADMISSION' BEFORE 'OTHER';--> statement-breakpoint
ALTER TABLE "fee_heads" ALTER COLUMN "created_by_user_id_fk" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_heads" ALTER COLUMN "updated_by_user_id_fk" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ALTER COLUMN "amount_paid" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ALTER COLUMN "amount_paid" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_types" ALTER COLUMN "created_by_user_id_fk" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_types" ALTER COLUMN "updated_by_user_id_fk" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_structure_components" ADD COLUMN "legacy_fee_structure_id" integer;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "legacy_fee_structure_id" integer;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "advance_for_session_id_fk" integer;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_advance_for_session_id_fk_sessions_id_fk" FOREIGN KEY ("advance_for_session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;