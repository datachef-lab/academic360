CREATE TABLE "guardians" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"guardian_details_person_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guardians_student_id_fk_unique" UNIQUE("student_id_fk")
);
--> statement-breakpoint
CREATE TABLE "parent_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"parent_type" "parent_type",
	"father_details_person_id_fk" integer,
	"mother_details_person_id_fk" integer,
	"annual_income_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parent_details_student_id_fk_unique" UNIQUE("student_id_fk")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_guardian_details_person_id_fk_person_id_fk" FOREIGN KEY ("guardian_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_details" ADD CONSTRAINT "parent_details_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_details" ADD CONSTRAINT "parent_details_father_details_person_id_fk_person_id_fk" FOREIGN KEY ("father_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_details" ADD CONSTRAINT "parent_details_mother_details_person_id_fk_person_id_fk" FOREIGN KEY ("mother_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_details" ADD CONSTRAINT "parent_details_annual_income_id_fk_annual_incomes_id_fk" FOREIGN KEY ("annual_income_id_fk") REFERENCES "public"."annual_incomes"("id") ON DELETE no action ON UPDATE no action;