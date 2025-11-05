ALTER TABLE "students" ADD COLUMN "taken_transfer_certificate" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "has_cancelled_admission" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "cancelled_admission_reason" varchar(1000);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "cancelled_admission_at" timestamp;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "cancelled_admission_by_user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_cancelled_admission_by_user_id_fk_users_id_fk" FOREIGN KEY ("cancelled_admission_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;