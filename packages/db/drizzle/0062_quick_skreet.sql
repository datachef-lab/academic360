CREATE TABLE "subject_grouping_main" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"subject_type_id_fk" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"code" varchar(500),
	"description" varchar(500),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_grouping_program_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_grouping_main_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_grouping_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_grouping_main_id_fk" integer NOT NULL,
	"subject_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subject_grouping_main" ADD CONSTRAINT "subject_grouping_main_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_grouping_main" ADD CONSTRAINT "subject_grouping_main_subject_type_id_fk_subject_types_id_fk" FOREIGN KEY ("subject_type_id_fk") REFERENCES "public"."subject_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_grouping_program_courses" ADD CONSTRAINT "subject_grouping_program_courses_subject_grouping_main_id_fk_subject_grouping_main_id_fk" FOREIGN KEY ("subject_grouping_main_id_fk") REFERENCES "public"."subject_grouping_main"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_grouping_program_courses" ADD CONSTRAINT "subject_grouping_program_courses_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_grouping_subjects" ADD CONSTRAINT "subject_grouping_subjects_subject_grouping_main_id_fk_subject_grouping_main_id_fk" FOREIGN KEY ("subject_grouping_main_id_fk") REFERENCES "public"."subject_grouping_main"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_grouping_subjects" ADD CONSTRAINT "subject_grouping_subjects_subject_id_fk_subjects_id_fk" FOREIGN KEY ("subject_id_fk") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;