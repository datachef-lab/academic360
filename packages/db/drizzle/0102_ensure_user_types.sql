-- Ensure user_types table exists (fixes fresh DBs where 0097_yellow_whiplash never ran)
CREATE TABLE IF NOT EXISTS "user_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_user_type_id_fk" integer,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"code" varchar(255),
	"color" varchar(255),
	"bg_color" varchar(255),
	"allowed_designation_filtering" boolean DEFAULT false NOT NULL,
	"allowed_module_type_filtering" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_types" ADD CONSTRAINT "user_types_parent_user_type_id_fk_user_types_id_fk" FOREIGN KEY ("parent_user_type_id_fk") REFERENCES "public"."user_types"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN undefined_table OR duplicate_object THEN null; END $$;
