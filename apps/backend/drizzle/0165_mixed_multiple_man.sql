DO $$ BEGIN CREATE TYPE "public"."notification_event_data_source" AS ENUM('UPLOAD', 'AUTO_FETCH'); EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."notification_event_status" AS ENUM('DRAFT', 'READY', 'TRIGGERED'); EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
ALTER TYPE "public"."id_card_field_key" ADD VALUE IF NOT EXISTS 'SHIFT';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admission_quota_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_name" varchar(255),
	"print_on_id_card" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admission_quota_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_event_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"category_id_fk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_event_genders" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"gender" "gender_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_event_quota_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"quota_type_id_fk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_event_religions" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"religion_id_fk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_event_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"section_id_fk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_event_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"shift_id_fk" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD COLUMN IF NOT EXISTS "best_of_five" double precision;--> statement-breakpoint
ALTER TABLE "subject_grouping_main" ADD COLUMN IF NOT EXISTS "previous_subject_grouping_id_fk" integer;--> statement-breakpoint
ALTER TABLE "copy_details" ADD COLUMN IF NOT EXISTS "author_type_id_fk" integer;--> statement-breakpoint
ALTER TABLE "journals" ADD COLUMN IF NOT EXISTS "published_year" varchar(255);--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN IF NOT EXISTS "remarks" text;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN IF NOT EXISTS "variant" "notification_variant";--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN IF NOT EXISTS "academic_year_id_fk" integer;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN IF NOT EXISTS "program_course_id_fk" integer;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN IF NOT EXISTS "class_id_fk" integer;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN IF NOT EXISTS "data_source_mode" "notification_event_data_source" DEFAULT 'UPLOAD';--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN IF NOT EXISTS "status" "notification_event_status" DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN IF NOT EXISTS "recipients_file_key" text;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN IF NOT EXISTS "upload_summary" json;--> statement-breakpoint
ALTER TABLE "notification_masters" ADD COLUMN IF NOT EXISTS "is_system_triggered" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "is_internal" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_notification_verifier" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "quota_type_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "copy_details_id_fk" integer;--> statement-breakpoint
ALTER TABLE "id_card_templates" ADD COLUMN IF NOT EXISTS "qrcode_height" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "id_card_template_fields" ADD COLUMN IF NOT EXISTS "align" varchar(10) DEFAULT 'LEFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD COLUMN IF NOT EXISTS "legacy_issue_id" bigint;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_categories" ADD CONSTRAINT "notification_event_categories_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_categories" ADD CONSTRAINT "notification_event_categories_category_id_fk_categories_id_fk" FOREIGN KEY ("category_id_fk") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_genders" ADD CONSTRAINT "notification_event_genders_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_quota_types" ADD CONSTRAINT "notification_event_quota_types_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_quota_types" ADD CONSTRAINT "notification_event_quota_types_quota_type_id_fk_admission_quota_types_id_fk" FOREIGN KEY ("quota_type_id_fk") REFERENCES "public"."admission_quota_types"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_religions" ADD CONSTRAINT "notification_event_religions_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_religions" ADD CONSTRAINT "notification_event_religions_religion_id_fk_religion_id_fk" FOREIGN KEY ("religion_id_fk") REFERENCES "public"."religion"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_sections" ADD CONSTRAINT "notification_event_sections_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_sections" ADD CONSTRAINT "notification_event_sections_section_id_fk_sections_id_fk" FOREIGN KEY ("section_id_fk") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_shifts" ADD CONSTRAINT "notification_event_shifts_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_event_shifts" ADD CONSTRAINT "notification_event_shifts_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "subject_grouping_main" ADD CONSTRAINT "subject_grouping_main_previous_subject_grouping_id_fk_subject_grouping_main_id_fk" FOREIGN KEY ("previous_subject_grouping_id_fk") REFERENCES "public"."subject_grouping_main"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_author_type_id_fk_author_types_id_fk" FOREIGN KEY ("author_type_id_fk") REFERENCES "public"."author_types"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "students" ADD CONSTRAINT "students_quota_type_id_fk_admission_quota_types_id_fk" FOREIGN KEY ("quota_type_id_fk") REFERENCES "public"."admission_quota_types"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "address" ADD CONSTRAINT "address_copy_details_id_fk_copy_details_id_fk" FOREIGN KEY ("copy_details_id_fk") REFERENCES "public"."copy_details"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cu_registration_correction_requests_student_id_idx" ON "cu_registration_correction_requests" USING btree ("student_id_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotions_program_course_id_idx" ON "promotions" USING btree ("program_course_id_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotions_student_id_idx" ON "promotions" USING btree ("student_id_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotions_session_id_idx" ON "promotions" USING btree ("session_id_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotions_active_idx" ON "promotions" USING btree ("program_course_id_fk","student_id_fk") WHERE "promotions"."end_date" is null and coalesce("promotions"."is_deprecated", false) = false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_subject_selections_student_active_idx" ON "student_subject_selections" USING btree ("student_id_fk") WHERE "student_subject_selections"."is_active" = true;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_legacy_issue_id_unique" UNIQUE("legacy_issue_id"); EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;
