CREATE TABLE "temp_admit_card_distributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"distributed_by_user_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "temp_admit_card_distributions" ADD CONSTRAINT "temp_admit_card_distributions_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temp_admit_card_distributions" ADD CONSTRAINT "temp_admit_card_distributions_distributed_by_user_id_fk_users_id_fk" FOREIGN KEY ("distributed_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;