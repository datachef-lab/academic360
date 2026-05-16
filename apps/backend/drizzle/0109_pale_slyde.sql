CREATE TYPE "public"."certificate_field_master_type" AS ENUM('INPUT', 'TEXTAREA', 'SELECT', 'NUMBER', 'DATE');--> statement-breakpoint
CREATE TABLE "career_progression_form_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"career_progression_form_id_fk" integer NOT NULL,
	"certificate_field_master_id_fk" integer NOT NULL,
	"certificate_field_option_master_id_fk" integer,
	"value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_progression_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"certificate_master_id_fk" integer NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"student_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_field_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"certificate_master_id_fk" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"type" "certificate_field_master_type" DEFAULT 'INPUT' NOT NULL,
	"is_semester_field_required" boolean DEFAULT false NOT NULL,
	"sequence" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_field_option_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"certificate_field_option_master_id_fk" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"sequence" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" varchar(700) NOT NULL,
	"sequence" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "career_progression_form_fields" ADD CONSTRAINT "career_progression_form_fields_career_progression_form_id_fk_career_progression_forms_id_fk" FOREIGN KEY ("career_progression_form_id_fk") REFERENCES "public"."career_progression_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_progression_form_fields" ADD CONSTRAINT "career_progression_form_fields_certificate_field_master_id_fk_certificate_field_master_id_fk" FOREIGN KEY ("certificate_field_master_id_fk") REFERENCES "public"."certificate_field_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_progression_form_fields" ADD CONSTRAINT "career_progression_form_fields_certificate_field_option_master_id_fk_certificate_field_option_master_id_fk" FOREIGN KEY ("certificate_field_option_master_id_fk") REFERENCES "public"."certificate_field_option_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_progression_forms" ADD CONSTRAINT "career_progression_forms_certificate_master_id_fk_certificate_master_id_fk" FOREIGN KEY ("certificate_master_id_fk") REFERENCES "public"."certificate_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_progression_forms" ADD CONSTRAINT "career_progression_forms_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_progression_forms" ADD CONSTRAINT "career_progression_forms_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_field_master" ADD CONSTRAINT "certificate_field_master_certificate_master_id_fk_certificate_master_id_fk" FOREIGN KEY ("certificate_master_id_fk") REFERENCES "public"."certificate_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_field_option_master" ADD CONSTRAINT "certificate_field_option_master_certificate_field_option_master_id_fk_certificate_field_master_id_fk" FOREIGN KEY ("certificate_field_option_master_id_fk") REFERENCES "public"."certificate_field_master"("id") ON DELETE no action ON UPDATE no action;