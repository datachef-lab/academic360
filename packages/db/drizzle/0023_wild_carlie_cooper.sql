CREATE TYPE "public"."process_status" AS ENUM('INACTIVE', 'ACTIVE', 'PAUSED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."process_type" AS ENUM('SUBJECT_SELECTION', 'CU_REGISTRATION');--> statement-breakpoint
CREATE TABLE "notification_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id_fk" integer NOT NULL,
	"notification_event_id_fk" integer NOT NULL,
	"email_template" varchar(255),
	"whatsapp_field_id_fk" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_by_user_id_fk" integer,
	"updated_by_user_id_fk" integer,
	"email_template" varchar(255),
	"notification_master_id_fk" integer,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_master_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_master_id_fk" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_master_meta" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_master_id_fk" integer NOT NULL,
	"notification_master_field_id_fk" integer NOT NULL,
	"sequence" integer NOT NULL,
	"flag" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_masters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"template" varchar(255),
	"preview_image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_masters_name_unique" UNIQUE("name"),
	CONSTRAINT "notification_masters_template_unique" UNIQUE("template")
);
--> statement-breakpoint
CREATE TABLE "notification_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id_fk" integer NOT NULL,
	"type" "notification_queue_type" NOT NULL,
	"retry_attempts" integer DEFAULT 0 NOT NULL,
	"is_dead_letter" boolean DEFAULT false NOT NULL,
	"failed_reason" text,
	"dead_letter_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_form_id_fk" integer,
	"user_id_fk" integer,
	"notification_event_id_fk" integer,
	"variant" "notification_variant" NOT NULL,
	"type" "notification_type" NOT NULL,
	"message" text NOT NULL,
	"status" "notification_status" NOT NULL,
	"sent_at" timestamp,
	"failed_at" timestamp,
	"failed_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "process_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"semester" integer NOT NULL,
	"process_type" "process_type" NOT NULL,
	"status" "process_status" DEFAULT 'INACTIVE' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"is_auto_start" boolean DEFAULT false,
	"is_auto_end" boolean DEFAULT false,
	"max_retries" integer DEFAULT 3,
	"title" varchar(500),
	"description" text,
	"instructions" text,
	"allow_late_submission" boolean DEFAULT false,
	"require_approval" boolean DEFAULT true,
	"send_notifications" boolean DEFAULT true,
	"created_by_user_id_fk" integer,
	"updated_by_user_id_fk" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admission_academic_info" RENAME COLUMN "legacy_academic_info_id" TO "legacy_academic_details_id";--> statement-breakpoint
ALTER TABLE "admission_academic_info" ALTER COLUMN "application_form_id_fk" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD COLUMN "legacy_student_academic_details_id" integer;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD COLUMN "student_id_fk" integer;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD COLUMN "previous_registration_number" varchar(255);--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD COLUMN "exam_number" varchar(255);--> statement-breakpoint
ALTER TABLE "student_academic_subjects" ADD COLUMN "legacy_student_subject_details_id" integer;--> statement-breakpoint
ALTER TABLE "notification_contents" ADD CONSTRAINT "notification_contents_notification_id_fk_notifications_id_fk" FOREIGN KEY ("notification_id_fk") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_contents" ADD CONSTRAINT "notification_contents_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_contents" ADD CONSTRAINT "notification_contents_whatsapp_field_id_fk_notification_master_fields_id_fk" FOREIGN KEY ("whatsapp_field_id_fk") REFERENCES "public"."notification_master_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_notification_master_id_fk_notification_masters_id_fk" FOREIGN KEY ("notification_master_id_fk") REFERENCES "public"."notification_masters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_master_fields" ADD CONSTRAINT "notification_master_fields_notification_master_id_fk_notification_masters_id_fk" FOREIGN KEY ("notification_master_id_fk") REFERENCES "public"."notification_masters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_master_meta" ADD CONSTRAINT "notification_master_meta_notification_master_id_fk_notification_masters_id_fk" FOREIGN KEY ("notification_master_id_fk") REFERENCES "public"."notification_masters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_master_meta" ADD CONSTRAINT "notification_master_meta_notification_master_field_id_fk_notification_master_fields_id_fk" FOREIGN KEY ("notification_master_field_id_fk") REFERENCES "public"."notification_master_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_queue" ADD CONSTRAINT "notification_queue_notification_id_fk_notifications_id_fk" FOREIGN KEY ("notification_id_fk") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_notification_event_id_fk_notification_events_id_fk" FOREIGN KEY ("notification_event_id_fk") REFERENCES "public"."notification_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_controls" ADD CONSTRAINT "process_controls_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_controls" ADD CONSTRAINT "process_controls_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;