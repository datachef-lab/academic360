CREATE TABLE "board_subject_univ_subject_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id_fk" integer,
	"board_subject_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "related_subjects_main" DROP CONSTRAINT "related_subjects_main_board_subject_name_id_fk_board_subject_names_id_fk";
--> statement-breakpoint
ALTER TABLE "related_subjects_sub" DROP CONSTRAINT "related_subjects_sub_board_subject_name_id_fk_board_subject_names_id_fk";
--> statement-breakpoint
ALTER TABLE "related_subjects_main" ADD COLUMN "board_subject_univ_subject_mapping_id_fk" integer;--> statement-breakpoint
ALTER TABLE "related_subjects_sub" ADD COLUMN "board_subject_univ_subject_mapping_id_fk" integer;--> statement-breakpoint
ALTER TABLE "board_subject_univ_subject_mappings" ADD CONSTRAINT "board_subject_univ_subject_mappings_subject_id_fk_subjects_id_fk" FOREIGN KEY ("subject_id_fk") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_subject_univ_subject_mappings" ADD CONSTRAINT "board_subject_univ_subject_mappings_board_subject_id_fk_board_subjects_id_fk" FOREIGN KEY ("board_subject_id_fk") REFERENCES "public"."board_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_subjects_main" ADD CONSTRAINT "related_subjects_main_board_subject_univ_subject_mapping_id_fk_board_subject_univ_subject_mappings_id_fk" FOREIGN KEY ("board_subject_univ_subject_mapping_id_fk") REFERENCES "public"."board_subject_univ_subject_mappings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_subjects_sub" ADD CONSTRAINT "related_subjects_sub_board_subject_univ_subject_mapping_id_fk_board_subject_univ_subject_mappings_id_fk" FOREIGN KEY ("board_subject_univ_subject_mapping_id_fk") REFERENCES "public"."board_subject_univ_subject_mappings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_subjects_main" DROP COLUMN "board_subject_name_id_fk";--> statement-breakpoint
ALTER TABLE "related_subjects_sub" DROP COLUMN "board_subject_name_id_fk";