CREATE TABLE "exam_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id_fk" integer NOT NULL,
	"promotion_id_fk" integer NOT NULL,
	"exam_room_id_fk" integer NOT NULL,
	"exam_subject_type_id_fk" integer NOT NULL,
	"exam_subject_id_fk" integer NOT NULL,
	"paper_id_fk" integer NOT NULL,
	"seat_number" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_program_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id_fk" integer NOT NULL,
	"room_id_fk" integer NOT NULL,
	"students_per_bench" integer NOT NULL,
	"capacity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id_fk" integer NOT NULL,
	"shift_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_subject_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id_fk" integer NOT NULL,
	"subject_type_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id_fk" integer NOT NULL,
	"subject_id_fk" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_exam_assginment_id" integer,
	"academic_year_id" integer NOT NULL,
	"exam_type_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"order_type" "exam_order_type",
	"gender" "gender_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "previous_paper_id_fk" integer;--> statement-breakpoint
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_exam_id_fk_exams_id_fk" FOREIGN KEY ("exam_id_fk") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_promotion_id_fk_promotions_id_fk" FOREIGN KEY ("promotion_id_fk") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_exam_room_id_fk_exam_rooms_id_fk" FOREIGN KEY ("exam_room_id_fk") REFERENCES "public"."exam_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_exam_subject_type_id_fk_exam_subject_types_id_fk" FOREIGN KEY ("exam_subject_type_id_fk") REFERENCES "public"."exam_subject_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_exam_subject_id_fk_exam_subjects_id_fk" FOREIGN KEY ("exam_subject_id_fk") REFERENCES "public"."exam_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_paper_id_fk_papers_id_fk" FOREIGN KEY ("paper_id_fk") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_program_courses" ADD CONSTRAINT "exam_program_courses_exam_id_fk_exams_id_fk" FOREIGN KEY ("exam_id_fk") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_program_courses" ADD CONSTRAINT "exam_program_courses_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_rooms" ADD CONSTRAINT "exam_rooms_exam_id_fk_exams_id_fk" FOREIGN KEY ("exam_id_fk") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_rooms" ADD CONSTRAINT "exam_rooms_room_id_fk_rooms_id_fk" FOREIGN KEY ("room_id_fk") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_shifts" ADD CONSTRAINT "exam_shifts_exam_id_fk_exams_id_fk" FOREIGN KEY ("exam_id_fk") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_shifts" ADD CONSTRAINT "exam_shifts_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subject_types" ADD CONSTRAINT "exam_subject_types_exam_id_fk_exams_id_fk" FOREIGN KEY ("exam_id_fk") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subject_types" ADD CONSTRAINT "exam_subject_types_subject_type_id_fk_subject_types_id_fk" FOREIGN KEY ("subject_type_id_fk") REFERENCES "public"."subject_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_exam_id_fk_exams_id_fk" FOREIGN KEY ("exam_id_fk") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_subjects" ADD CONSTRAINT "exam_subjects_subject_id_fk_subjects_id_fk" FOREIGN KEY ("subject_id_fk") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_exam_type_id_fk_exam_types_id_fk" FOREIGN KEY ("exam_type_id_fk") REFERENCES "public"."exam_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_previous_paper_id_fk_papers_id_fk" FOREIGN KEY ("previous_paper_id_fk") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;