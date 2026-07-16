ALTER TABLE "id_card_templates" ALTER COLUMN "canvas_width_px" SET DEFAULT 638;--> statement-breakpoint
ALTER TABLE "id_card_templates" ALTER COLUMN "canvas_height_px" SET DEFAULT 1004;--> statement-breakpoint
ALTER TABLE "id_card_templates" ADD COLUMN "backside_image_key" varchar(1000);--> statement-breakpoint
ALTER TABLE "id_card_templates" ADD COLUMN "backside_image_url" varchar(2000);