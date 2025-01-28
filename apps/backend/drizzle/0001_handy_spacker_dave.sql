ALTER TABLE "academic_history" DROP CONSTRAINT "academic_history_last_board_university_id_board_universities_id";
--> statement-breakpoint
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_last_board_university_id_board_universities_id_fk" FOREIGN KEY ("last_board_university_id") REFERENCES "public"."board_universities"("id") ON DELETE no action ON UPDATE no action;