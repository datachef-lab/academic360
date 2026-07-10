CREATE TYPE "public"."notification_event_data_source" AS ENUM('UPLOAD', 'AUTO_FETCH');--> statement-breakpoint
CREATE TYPE "public"."notification_event_status" AS ENUM('DRAFT', 'READY', 'TRIGGERED');--> statement-breakpoint
CREATE TABLE "notification_event_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"category_id_fk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_event_genders" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"gender" "gender_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_event_quota_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"quota_type_id_fk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_event_religions" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"religion_id_fk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_event_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"section_id_fk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_event_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"shift_id_fk" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "remarks" text;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "variant" "notification_variant";--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "academic_year_id_fk" integer;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "program_course_id_fk" integer;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "class_id_fk" integer;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "data_source_mode" "notification_event_data_source" DEFAULT 'UPLOAD';--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "status" "notification_event_status" DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "recipients_file_key" text;--> statement-breakpoint
ALTER TABLE "notification_events" ADD COLUMN "upload_summary" json;--> statement-breakpoint
ALTER TABLE "notification_masters" ADD COLUMN "is_system_triggered" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "is_internal" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_notification_verifier" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "notification_event_categories" ADD CONSTRAINT "notification_event_categories_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_categories" ADD CONSTRAINT "notification_event_categories_category_id_fk_categories_id_fk" FOREIGN KEY ("category_id_fk") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_genders" ADD CONSTRAINT "notification_event_genders_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_quota_types" ADD CONSTRAINT "notification_event_quota_types_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_quota_types" ADD CONSTRAINT "notification_event_quota_types_quota_type_id_fk_admission_quota_types_id_fk" FOREIGN KEY ("quota_type_id_fk") REFERENCES "public"."admission_quota_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_religions" ADD CONSTRAINT "notification_event_religions_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_religions" ADD CONSTRAINT "notification_event_religions_religion_id_fk_religion_id_fk" FOREIGN KEY ("religion_id_fk") REFERENCES "public"."religion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_sections" ADD CONSTRAINT "notification_event_sections_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_sections" ADD CONSTRAINT "notification_event_sections_section_id_fk_sections_id_fk" FOREIGN KEY ("section_id_fk") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_shifts" ADD CONSTRAINT "notification_event_shifts_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_event_shifts" ADD CONSTRAINT "notification_event_shifts_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
