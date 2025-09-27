ALTER TABLE "student_subject_selections" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD COLUMN "parent_id_fk" integer;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD COLUMN "is_deprecated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD COLUMN "created_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD COLUMN "change_reason" text;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_parent_id_fk_student_subject_selections_id_fk" FOREIGN KEY ("parent_id_fk") REFERENCES "public"."student_subject_selections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;