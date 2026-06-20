CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_vendor_id" integer,
	"name" varchar(1000) NOT NULL,
	"code" varchar(500),
	"email" varchar(500),
	"phone" varchar(15),
	"website" varchar(5000),
	"person_of_contact" varchar(1000),
	"person_of_contact_email" varchar(500),
	"person_of_contact_phone" varchar(15),
	"pan" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "vendor_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_vendor_id_fk_vendors_id_fk" FOREIGN KEY ("vendor_id_fk") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;