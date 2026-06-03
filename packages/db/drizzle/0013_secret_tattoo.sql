CREATE TABLE "student_subject_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id_fk" integer NOT NULL,
	"subject_selection_meta_id_fk" integer NOT NULL,
	"student_id_fk" integer NOT NULL,
	"subject_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subject_selection_meta_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_selection_meta_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subject_selection_meta" (
	"id" serial PRIMARY KEY NOT NULL,
	"stream_id_fk" integer NOT NULL,
	"subject_type_id_fk" integer NOT NULL,
	"label" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_subject_selection_meta_id_fk_subject_selection_meta_id_fk" FOREIGN KEY ("subject_selection_meta_id_fk") REFERENCES "public"."subject_selection_meta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_subject_id_fk_subjects_id_fk" FOREIGN KEY ("subject_id_fk") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_selection_meta_classes" ADD CONSTRAINT "subject_selection_meta_classes_subject_selection_meta_id_fk_subject_selection_meta_id_fk" FOREIGN KEY ("subject_selection_meta_id_fk") REFERENCES "public"."subject_selection_meta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_selection_meta_classes" ADD CONSTRAINT "subject_selection_meta_classes_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_selection_meta" ADD CONSTRAINT "subject_selection_meta_stream_id_fk_streams_id_fk" FOREIGN KEY ("stream_id_fk") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_selection_meta" ADD CONSTRAINT "subject_selection_meta_subject_type_id_fk_subject_types_id_fk" FOREIGN KEY ("subject_type_id_fk") REFERENCES "public"."subject_types"("id") ON DELETE no action ON UPDATE no action;