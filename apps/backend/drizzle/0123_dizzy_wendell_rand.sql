CREATE TYPE "public"."exam_form_fillup_status" AS ENUM('PENDING', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "exam_form_fillup" (
	"id" serial PRIMARY KEY NOT NULL,
	"promotion_id_fk" integer NOT NULL,
	"status" "exam_form_fillup_status" DEFAULT 'PENDING' NOT NULL,
	"form_filled_by_user_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD CONSTRAINT "exam_form_fillup_promotion_id_fk_promotions_id_fk" FOREIGN KEY ("promotion_id_fk") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_form_fillup" ADD CONSTRAINT "exam_form_fillup_form_filled_by_user_id_fk_users_id_fk" FOREIGN KEY ("form_filled_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;