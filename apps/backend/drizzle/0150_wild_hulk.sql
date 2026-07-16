CREATE TYPE "public"."id_card_field_key" AS ENUM('NAME', 'COURSE', 'UID', 'MOBILE', 'BLOOD_GROUP', 'SPORTS_QUOTA', 'QRCODE', 'VALID_TILL_DATE', 'PHOTO');--> statement-breakpoint
CREATE TYPE "public"."id_card_issue_status" AS ENUM('ISSUED', 'RENEWED', 'REISSUED');--> statement-breakpoint
CREATE TABLE "id_card_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template_image_key" varchar(1000) NOT NULL,
	"template_image_url" varchar(2000),
	"canvas_width_px" integer DEFAULT 600 NOT NULL,
	"canvas_height_px" integer DEFAULT 900 NOT NULL,
	"qrcode_size" integer DEFAULT 0 NOT NULL,
	"valid_from" date,
	"valid_till" date,
	"is_default" boolean DEFAULT false NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_by_user_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "id_card_template_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id_fk" integer NOT NULL,
	"field_key" "id_card_field_key" NOT NULL,
	"x" integer DEFAULT 0 NOT NULL,
	"y" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "id_card_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"template_id_fk" integer,
	"issue_status" "id_card_issue_status" DEFAULT 'ISSUED' NOT NULL,
	"renewed_from_issue_id_fk" integer,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"valid_from" date,
	"valid_till" date,
	"rfid_number" varchar(255),
	"front_image_key" varchar(1000),
	"front_image_url" varchar(2000),
	"photo_image_key" varchar(1000),
	"photo_image_url" varchar(2000),
	"name_snapshot" varchar(500),
	"course_snapshot" varchar(500),
	"blood_group_snapshot" varchar(50),
	"mobile_snapshot" varchar(50),
	"sports_quota_snapshot" varchar(100),
	"uid_snapshot" varchar(255),
	"remarks" text,
	"issued_by_user_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_gate_events" ADD COLUMN IF NOT EXISTS "zone_id_fk" integer;--> statement-breakpoint
ALTER TABLE "library_entry_exit" ADD COLUMN IF NOT EXISTS "zone_id_fk" integer;--> statement-breakpoint
ALTER TABLE "id_card_templates" ADD CONSTRAINT "id_card_templates_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "id_card_templates" ADD CONSTRAINT "id_card_templates_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "id_card_template_fields" ADD CONSTRAINT "id_card_template_fields_template_id_fk_id_card_templates_id_fk" FOREIGN KEY ("template_id_fk") REFERENCES "public"."id_card_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_template_id_fk_id_card_templates_id_fk" FOREIGN KEY ("template_id_fk") REFERENCES "public"."id_card_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_renewed_from_issue_id_fk_id_card_issues_id_fk" FOREIGN KEY ("renewed_from_issue_id_fk") REFERENCES "public"."id_card_issues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_issued_by_user_id_fk_users_id_fk" FOREIGN KEY ("issued_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_template_field" ON "id_card_template_fields" USING btree ("template_id_fk","field_key");--> statement-breakpoint
CREATE INDEX "idx_id_card_issues_student_date" ON "id_card_issues" USING btree ("student_id_fk","issue_date");--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "library_gate_events" ADD CONSTRAINT "library_gate_events_zone_id_fk_library_zones_id_fk" FOREIGN KEY ("zone_id_fk") REFERENCES "public"."library_zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "library_entry_exit" ADD CONSTRAINT "library_entry_exit_zone_id_fk_library_zones_id_fk" FOREIGN KEY ("zone_id_fk") REFERENCES "public"."library_zones"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;