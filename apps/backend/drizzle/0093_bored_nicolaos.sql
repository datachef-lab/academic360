CREATE TYPE "public"."payment_for_type" AS ENUM('ADMISSION_APPLICATION_FEE', 'FEE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('RAZORPAY', 'PAYTM', 'PAYU', 'CCAVENUE', 'OTHER', 'CASHFREE', 'OFFLINE');--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "application_form_id_fk" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "order_id" SET DATA TYPE varchar(1000);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_for_type" "payment_for_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_response" jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_unique" UNIQUE("order_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_transaction_id_unique" UNIQUE("transaction_id");