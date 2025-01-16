CREATE TYPE "public"."stream_level" AS ENUM('UNDER_GRADUATE', 'POST_GRADUATE');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('HONOURS', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."subject_type" AS ENUM('COMMON', 'SPECIAL', 'HONOURS', 'GENERAL', 'ELECTIVE');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('ADMIN', 'STUDENT', 'TEACHER');--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "marksheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"semester" integer NOT NULL,
	"year1" integer NOT NULL,
	"year2" integer,
	"sgpa" numeric,
	"cgpa" numeric,
	"remarks" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" "stream_level" DEFAULT 'UNDER_GRADUATE' NOT NULL,
	"duration" integer NOT NULL,
	"number_of_semesters" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id_fk" integer NOT NULL,
	"year_of_admission" integer,
	"application_number" varchar(255),
	"apaar_id" varchar(255),
	"nationality" varchar(255),
	"aadhaar_number" varchar(255),
	"uid" varchar(16),
	"stream_id_fk" integer NOT NULL,
	"course" "course_type" DEFAULT 'HONOURS' NOT NULL,
	"section" varchar(255),
	"class_roll_number" integer,
	"registration_number" varchar(255),
	"roll_number" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"marksheet_id_fk" integer,
	"subject_metadata_id_fk" integer,
	"internal_marks" integer,
	"theory_marks" integer,
	"practical_marks" integer,
	"total_marks" integer,
	"status" varchar(255),
	"letter_grade" varchar(255),
	"ngp" numeric,
	"tgp" numeric
);
--> statement-breakpoint
CREATE TABLE "subject_metadatas" (
	"id" serial PRIMARY KEY NOT NULL,
	"stream_id_fk" integer NOT NULL,
	"semester" integer NOT NULL,
	"subject_type" "subject_type" DEFAULT 'COMMON' NOT NULL,
	"name" varchar(255) NOT NULL,
	"credit" integer,
	"full_marks" integer NOT NULL,
	"full_marks_internal" integer NOT NULL,
	"full_marks_practical" integer NOT NULL,
	"full_marks_theory" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(500) NOT NULL,
	"password" varchar(255) NOT NULL,
	"phone" varchar(11),
	"image" varchar(255),
	"type" "user_type" DEFAULT 'STUDENT',
	"disabled" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_stream_id_fk_streams_id_fk" FOREIGN KEY ("stream_id_fk") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_marksheet_id_fk_marksheets_id_fk" FOREIGN KEY ("marksheet_id_fk") REFERENCES "public"."marksheets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_subject_metadata_id_fk_subject_metadatas_id_fk" FOREIGN KEY ("subject_metadata_id_fk") REFERENCES "public"."subject_metadatas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD CONSTRAINT "subject_metadatas_stream_id_fk_streams_id_fk" FOREIGN KEY ("stream_id_fk") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;