CREATE TABLE "access_group_module__program_course__class" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_group_module_program_course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"is_allowed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_access_group_module_pc_class" UNIQUE("access_group_module_program_course_id_fk","class_id_fk")
);
--> statement-breakpoint
DROP TABLE "access_group_module__class" CASCADE;--> statement-breakpoint
ALTER TABLE "access_group_module__program_course__class" ADD CONSTRAINT "access_group_module__program_course__class_access_group_module_program_course_id_fk_access_group_module__program_course_id_fk" FOREIGN KEY ("access_group_module_program_course_id_fk") REFERENCES "public"."access_group_module__program_course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group_module__program_course__class" ADD CONSTRAINT "access_group_module__program_course__class_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;