CREATE TABLE "cu_physical_reg" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"time" varchar(255) NOT NULL,
	"venue" varchar(255) NOT NULL,
	"submission_date" date NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cu_physical_reg" ADD CONSTRAINT "cu_physical_reg_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cu_physical_reg" ADD CONSTRAINT "cu_physical_reg_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cu_physical_reg_student_class_uq" ON "cu_physical_reg" USING btree ("student_id_fk","class_id_fk");