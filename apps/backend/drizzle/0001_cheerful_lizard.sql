CREATE TABLE "academic_identifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"framework_type" "framework_type" DEFAULT 'CBCS' NOT NULL,
	"rfid" varchar(255),
	"stream_id_fk" integer NOT NULL,
	"course" "course_type" DEFAULT 'HONOURS' NOT NULL,
	"cu_form_number" varchar(255),
	"uid" varchar(255),
	"old_uid" varchar(255),
	"registration_number" varchar(255),
	"roll_number" varchar(255),
	"section" varchar(255),
	"class_roll_number" integer,
	"apaar_id" varchar(255),
	"abc_id" varchar(255),
	"apprid" varchar(255),
	"check_repeat" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "academic_identifiers_studentId_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "admissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"application_number" varchar(255),
	"applicant_signature" varchar(255),
	"year_of_admission" integer,
	"admission_date" date,
	"admission_code" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admissions_studentId_unique" UNIQUE("student_id")
);
--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "students_stream_id_fk_streams_id_fk";
--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD COLUMN "framework_type" "framework_type" DEFAULT 'CBCS' NOT NULL;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN "office_address_id" integer;--> statement-breakpoint
ALTER TABLE "academic_identifiers" ADD CONSTRAINT "academic_identifiers_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_identifiers" ADD CONSTRAINT "academic_identifiers_stream_id_fk_streams_id_fk" FOREIGN KEY ("stream_id_fk") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_office_address_id_address_id_fk" FOREIGN KEY ("office_address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" DROP COLUMN "office_address";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "application_number";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "applicant_signature";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "year_of_admission";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "admission_code";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "admission_date";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "framework_type";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "rfid";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "apaar_id";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "uid";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "old_uid";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "stream_id_fk";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "course";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "cu_form_number";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "check_repeat";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "registration_number";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "roll_number";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "section";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "class_roll_number";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "abc_id";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "apprid";