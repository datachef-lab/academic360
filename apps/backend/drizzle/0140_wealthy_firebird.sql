ALTER TABLE "certificate_field_master" ADD COLUMN "field_font_size" integer DEFAULT 16 NOT NULL;--> statement-breakpoint
ALTER TABLE "certificate_field_master" ADD COLUMN "description" varchar(5000);--> statement-breakpoint
ALTER TABLE "certificate_field_master" ADD COLUMN "description_font_size" integer DEFAULT 14 NOT NULL;