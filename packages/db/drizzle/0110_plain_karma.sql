ALTER TABLE "certificate_field_master" ADD COLUMN "is_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "certificate_master" ADD COLUMN "color" varchar(255);--> statement-breakpoint
ALTER TABLE "certificate_master" ADD COLUMN "bg_color" varchar(255);