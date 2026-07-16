CREATE TABLE IF NOT EXISTS "admission_quota_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admission_quota_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "quota_type_id_fk" integer;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "students" ADD CONSTRAINT "students_quota_type_id_fk_admission_quota_types_id_fk" FOREIGN KEY ("quota_type_id_fk") REFERENCES "public"."admission_quota_types"("id"); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
