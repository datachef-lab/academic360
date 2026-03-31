CREATE TABLE "payment_vendor_downtime" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor" varchar(255),
	"type" varchar,
	"current_downtime_states" varchar,
	"pay_method" varchar,
	"severity" varchar,
	"vendor_downtime_id" varchar,
	"downtime_start_time" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_vendor_downtime_entity" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_vendor_downtime_id_fk" integer NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar NOT NULL,
	"code" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payment_vendor_downtime_entity" ADD CONSTRAINT "payment_vendor_downtime_entity_payment_vendor_downtime_id_fk_payment_vendor_downtime_id_fk" FOREIGN KEY ("payment_vendor_downtime_id_fk") REFERENCES "public"."payment_vendor_downtime"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "transaction_response_code";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "transaction_status";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "transaction_response_message";