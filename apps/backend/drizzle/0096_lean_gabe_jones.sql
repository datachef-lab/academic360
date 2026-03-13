ALTER TABLE "temp_admit_card_distributions" RENAME COLUMN "exam_candidate_id_fk" TO "student_id_fk";--> statement-breakpoint
ALTER TABLE "temp_admit_card_distributions" DROP CONSTRAINT "temp_admit_card_distributions_exam_candidate_id_fk_exam_candidates_id_fk";
--> statement-breakpoint
ALTER TABLE "temp_admit_card_distributions" ADD CONSTRAINT "temp_admit_card_distributions_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;