ALTER TABLE "id_card_template_fields" ADD COLUMN "font_size" integer;--> statement-breakpoint
ALTER TABLE "id_card_templates" DROP COLUMN "valid_from";--> statement-breakpoint
ALTER TABLE "id_card_templates" DROP COLUMN "valid_till";