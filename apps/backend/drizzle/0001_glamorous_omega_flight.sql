CREATE TABLE "board_subject_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_board_subject_name_id" integer,
	"name" varchar(500) NOT NULL,
	"code" varchar(500),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "board_subject_names_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
ALTER TABLE "board_subjects" DROP CONSTRAINT "board_subjects_subject_id_fk_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "board_subjects" ADD COLUMN "board_subject_name_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "program_courses" ADD COLUMN "name" varchar(500);--> statement-breakpoint
ALTER TABLE "board_subjects" ADD CONSTRAINT "board_subjects_board_subject_name_id_fk_board_subject_names_id_fk" FOREIGN KEY ("board_subject_name_id_fk") REFERENCES "public"."board_subject_names"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_subjects" DROP COLUMN "subject_id_fk";