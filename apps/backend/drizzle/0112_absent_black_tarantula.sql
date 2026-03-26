CREATE TABLE "career_progression_form_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"career_progression_form_id_fk" integer NOT NULL,
	"certificate_master_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "career_progression_form_fields" DROP CONSTRAINT "career_progression_form_fields_career_progression_form_id_fk_career_progression_forms_id_fk";
--> statement-breakpoint
ALTER TABLE "career_progression_forms" DROP CONSTRAINT "career_progression_forms_certificate_master_id_fk_certificate_master_id_fk";
--> statement-breakpoint
ALTER TABLE "career_progression_form_fields" ADD COLUMN "career_progression_form_certificate_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "career_progression_form_certificates" ADD CONSTRAINT "career_progression_form_certificates_career_progression_form_id_fk_career_progression_forms_id_fk" FOREIGN KEY ("career_progression_form_id_fk") REFERENCES "public"."career_progression_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_progression_form_certificates" ADD CONSTRAINT "career_progression_form_certificates_certificate_master_id_fk_certificate_master_id_fk" FOREIGN KEY ("certificate_master_id_fk") REFERENCES "public"."certificate_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_progression_form_fields" ADD CONSTRAINT "career_progression_form_fields_career_progression_form_certificate_id_fk_career_progression_form_certificates_id_fk" FOREIGN KEY ("career_progression_form_certificate_id_fk") REFERENCES "public"."career_progression_form_certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_progression_form_fields" DROP COLUMN "career_progression_form_id_fk";--> statement-breakpoint
ALTER TABLE "career_progression_forms" DROP COLUMN "certificate_master_id_fk";