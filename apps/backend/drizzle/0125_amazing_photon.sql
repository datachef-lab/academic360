ALTER TABLE "promotions" DROP CONSTRAINT "promotions_promotion_status_id_fk_promotion_status_id_fk";
--> statement-breakpoint
ALTER TABLE "exam_form_fillup" DROP CONSTRAINT "exam_form_fillup_promotion_id_fk_promotions_id_fk";
--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "exam_form_fillup_id_fk" integer;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD COLUMN "student_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD COLUMN "session_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD COLUMN "program_course_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD COLUMN "class_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD COLUMN "appear_type_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_exam_form_fillup_id_fk_exam_form_fillup_id_fk" FOREIGN KEY ("exam_form_fillup_id_fk") REFERENCES "public"."exam_form_fillup"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD CONSTRAINT "exam_form_fillup_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD CONSTRAINT "exam_form_fillup_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD CONSTRAINT "exam_form_fillup_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD CONSTRAINT "exam_form_fillup_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD CONSTRAINT "exam_form_fillup_appear_type_id_fk_promotion_status_id_fk" FOREIGN KEY ("appear_type_id_fk") REFERENCES "public"."promotion_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" DROP COLUMN "promotion_status_id_fk";--> statement-breakpoint
ALTER TABLE "exam_form_fillup" DROP COLUMN "promotion_id_fk";--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_unique" UNIQUE("order_id");