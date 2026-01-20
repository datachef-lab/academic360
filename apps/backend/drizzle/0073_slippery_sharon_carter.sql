ALTER TABLE "exam_candidates" ADD COLUMN "admit_card_downloaded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exam_candidates" ADD COLUMN "admit_card_download_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "scheduled_by_user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "last_updated_by_user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "admit_card_start_download_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "admit_card_last_download_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_scheduled_by_user_id_fk_users_id_fk" FOREIGN KEY ("scheduled_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_last_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("last_updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;