ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_unique";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_transaction_id_unique";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_application_form_id_fk_application_forms_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_fee_student_mapping_id_fk_fee_student_mappings_id_fk";
--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD COLUMN "payment_id_fk" integer;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_payment_id_fk_payments_id_fk" FOREIGN KEY ("payment_id_fk") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" DROP COLUMN "payment_status";--> statement-breakpoint
ALTER TABLE "fee_student_mappings" DROP COLUMN "payment_mode";--> statement-breakpoint
ALTER TABLE "fee_student_mappings" DROP COLUMN "transaction_ref";--> statement-breakpoint
ALTER TABLE "fee_student_mappings" DROP COLUMN "transaction_date";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "application_form_id_fk";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "fee_student_mapping_id_fk";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "payment_for_type";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "order_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "transaction_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "payment_status";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "payment_mode";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bank_txn_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "gateway_name";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "txn_date";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "gateway_response";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "remarks";--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_receiptNumber_unique" UNIQUE("receipt_number");