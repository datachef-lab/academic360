ALTER TABLE "exam_form_fillup" DROP CONSTRAINT "exam_form_fillup_form_filled_by_user_id_fk_users_id_fk";
--> statement-breakpoint
ALTER TABLE "exam_form_fillup" DROP COLUMN "form_filled_by_user_id_fk";