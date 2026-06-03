CREATE TYPE "public"."exam_seat_allocation_mode" AS ENUM('STANDARD', 'FOIL_NUMBER_BASED');--> statement-breakpoint
CREATE TABLE "exam_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(1000) NOT NULL,
	"exam_commencement_date" date DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_candidates" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exam_candidates" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "exam_group_id_fk" integer;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "is_rooms_selected" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "seat_allocation_mode" "exam_seat_allocation_mode" DEFAULT 'STANDARD';--> statement-breakpoint
CREATE UNIQUE INDEX "exam_groups_name_date_unique" ON "exam_groups" USING btree ("name","exam_commencement_date");--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_exam_group_id_fk_exam_groups_id_fk" FOREIGN KEY ("exam_group_id_fk") REFERENCES "public"."exam_groups"("id") ON DELETE no action ON UPDATE no action;