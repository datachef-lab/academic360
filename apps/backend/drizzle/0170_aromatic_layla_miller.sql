CREATE TABLE "student_fee_due_declarations" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"semester_label" varchar(255) NOT NULL,
	"undertaking_clear_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_fee_due_declaration_student_semester" UNIQUE("student_id_fk","semester_label")
);
--> statement-breakpoint
ALTER TABLE "student_fee_due_declarations" ADD CONSTRAINT "student_fee_due_declarations_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;