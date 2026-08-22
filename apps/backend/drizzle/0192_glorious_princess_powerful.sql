ALTER TYPE "public"."id_card_issue_status" ADD VALUE 'DRAFT';--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD COLUMN "printed_by_user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD COLUMN "printed_at" timestamp;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD COLUMN "saved_at" timestamp;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_printed_by_user_id_fk_users_id_fk" FOREIGN KEY ("printed_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
