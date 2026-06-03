CREATE TYPE "public"."promotion_status_type" AS ENUM('REGULAR', 'READMISSION', 'CASUAL');--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_historical_record_id" integer,
	"student_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"session_id_fk" integer NOT NULL,
	"shift_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"section_id_fk" integer NOT NULL,
	"is_alumni" boolean DEFAULT false NOT NULL,
	"date_of_joining" timestamp NOT NULL,
	"class_roll_number" varchar NOT NULL,
	"roll_number" varchar,
	"roll_number_si" varchar,
	"exam_number" varchar,
	"exam_serial_number" varchar,
	"promotion_status_id_fk" integer NOT NULL,
	"board_result_status_id_fk" integer,
	"start_date" timestamp,
	"end_date" timestamp,
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotion_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_promotion_status_id" integer,
	"name" varchar(255) NOT NULL,
	"type" "promotion_status_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "related_subjects_main" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id_fk" integer,
	"program_course_id_fk" integer,
	"subject_type_id_fk" integer,
	"board_subject_name_id_fk" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "related_subjects_sub" (
	"id" serial PRIMARY KEY NOT NULL,
	"related_subject_main_id_fk" integer,
	"board_subject_name_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restricted_grouping_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"restricted_grouping_main_id_fk" integer,
	"class_id_fk" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restricted_grouping_main" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id_fk" integer,
	"subject_type_id_fk" integer,
	"subject_id_fk" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restricted_grouping_program_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"restricted_grouping_main_id_fk" integer,
	"program_course_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restricted_grouping_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"restricted_grouping_main_id_fk" integer,
	"cannot_combine_with_subject_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_specific_passing" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id_fk" integer,
	"passing_percentage" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" RENAME COLUMN "application_id_fk" TO "application_form_id_fk";--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_application_id_fk_application_forms_id_fk";
--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "legacy_section_id" integer;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_section_id_fk_sections_id_fk" FOREIGN KEY ("section_id_fk") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_promotion_status_id_fk_promotion_status_id_fk" FOREIGN KEY ("promotion_status_id_fk") REFERENCES "public"."promotion_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_board_result_status_id_fk_board_result_status_id_fk" FOREIGN KEY ("board_result_status_id_fk") REFERENCES "public"."board_result_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_subjects_main" ADD CONSTRAINT "related_subjects_main_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_subjects_main" ADD CONSTRAINT "related_subjects_main_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_subjects_main" ADD CONSTRAINT "related_subjects_main_subject_type_id_fk_subject_types_id_fk" FOREIGN KEY ("subject_type_id_fk") REFERENCES "public"."subject_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_subjects_main" ADD CONSTRAINT "related_subjects_main_board_subject_name_id_fk_board_subject_names_id_fk" FOREIGN KEY ("board_subject_name_id_fk") REFERENCES "public"."board_subject_names"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_subjects_sub" ADD CONSTRAINT "related_subjects_sub_related_subject_main_id_fk_related_subjects_main_id_fk" FOREIGN KEY ("related_subject_main_id_fk") REFERENCES "public"."related_subjects_main"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_subjects_sub" ADD CONSTRAINT "related_subjects_sub_board_subject_name_id_fk_board_subject_names_id_fk" FOREIGN KEY ("board_subject_name_id_fk") REFERENCES "public"."board_subject_names"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_grouping_classes" ADD CONSTRAINT "restricted_grouping_classes_restricted_grouping_main_id_fk_restricted_grouping_main_id_fk" FOREIGN KEY ("restricted_grouping_main_id_fk") REFERENCES "public"."restricted_grouping_main"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_grouping_classes" ADD CONSTRAINT "restricted_grouping_classes_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_grouping_main" ADD CONSTRAINT "restricted_grouping_main_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_grouping_main" ADD CONSTRAINT "restricted_grouping_main_subject_type_id_fk_subject_types_id_fk" FOREIGN KEY ("subject_type_id_fk") REFERENCES "public"."subject_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_grouping_main" ADD CONSTRAINT "restricted_grouping_main_subject_id_fk_subjects_id_fk" FOREIGN KEY ("subject_id_fk") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_grouping_program_courses" ADD CONSTRAINT "restricted_grouping_program_courses_restricted_grouping_main_id_fk_restricted_grouping_main_id_fk" FOREIGN KEY ("restricted_grouping_main_id_fk") REFERENCES "public"."restricted_grouping_main"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_grouping_program_courses" ADD CONSTRAINT "restricted_grouping_program_courses_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_grouping_subjects" ADD CONSTRAINT "restricted_grouping_subjects_restricted_grouping_main_id_fk_restricted_grouping_main_id_fk" FOREIGN KEY ("restricted_grouping_main_id_fk") REFERENCES "public"."restricted_grouping_main"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_grouping_subjects" ADD CONSTRAINT "restricted_grouping_subjects_cannot_combine_with_subject_id_fk_subjects_id_fk" FOREIGN KEY ("cannot_combine_with_subject_id_fk") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_specific_passing" ADD CONSTRAINT "subject_specific_passing_subject_id_fk_subjects_id_fk" FOREIGN KEY ("subject_id_fk") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;