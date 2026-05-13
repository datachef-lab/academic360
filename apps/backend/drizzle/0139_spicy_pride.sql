ALTER TABLE "fee_student_mappings" DROP CONSTRAINT "fee_student_mappings_payment_id_fk_payments_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "fee_student_mapping_id_fk" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "is_linked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_fee_student_mapping_id_fk_fee_student_mappings_id_fk" FOREIGN KEY ("fee_student_mapping_id_fk") REFERENCES "public"."fee_student_mappings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" DROP COLUMN "payment_id_fk";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_issuing_bank";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_issuing_bank_code";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_payment_mode";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_channel_name";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_channel_code";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "min_card_number_digits";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "max_card_number_digits";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "is_bin_cvv_required";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_cvv_length";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "is_bin_expiry_required";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "isbin_indian";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "isbin_active";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_country_code";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_country_name";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_country_numeric_code";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_currency_code";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_currency_name";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_currency_numeric_code";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "bin_currency_symbol";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "is_bin_eligible_for_coft";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "is_bin_coft_payment_supported";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "is_bin_eligible_for_alt_id";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "is_bin_alt_id_payment_supported";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "has_low_success_rate_status";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "has_low_success_rate_message";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "is_emi_available";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "icon_url";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "error_message";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "is_subscription_available";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "is_hybrid_pay_mode_disabled";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "prepaid_card";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "prepaid_card_max_amount";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "native_otp_eligible";