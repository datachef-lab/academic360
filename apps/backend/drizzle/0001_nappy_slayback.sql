ALTER TABLE "address" ALTER COLUMN "phone" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "address" ALTER COLUMN "pincode" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "emergency_contacts" ALTER COLUMN "phone" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "emergency_contacts" ALTER COLUMN "office_phone" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "emergency_contacts" ALTER COLUMN "residential_phone" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "person" ALTER COLUMN "aadhaar_card_number" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "whatsapp_number" SET DATA TYPE varchar(255);