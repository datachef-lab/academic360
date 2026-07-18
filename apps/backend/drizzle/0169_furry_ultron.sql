CREATE TYPE "public"."subject_selection_option_source" AS ENUM('ELECTIVE_SUBJECTS', 'PRIOR_SELECTION');--> statement-breakpoint
CREATE TABLE "subject_selection_meta_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_selection_meta_id_fk" integer NOT NULL,
	"source_subject_selection_meta_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subject_selection_meta_sources_unique" UNIQUE("subject_selection_meta_id_fk","source_subject_selection_meta_id_fk")
);
--> statement-breakpoint
ALTER TABLE "subject_selection_meta" ADD COLUMN "option_source" "subject_selection_option_source" DEFAULT 'ELECTIVE_SUBJECTS' NOT NULL;--> statement-breakpoint
ALTER TABLE "subject_selection_meta_sources" ADD CONSTRAINT "subject_selection_meta_sources_subject_selection_meta_id_fk_subject_selection_meta_id_fk" FOREIGN KEY ("subject_selection_meta_id_fk") REFERENCES "public"."subject_selection_meta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_selection_meta_sources" ADD CONSTRAINT "subject_selection_meta_sources_source_subject_selection_meta_id_fk_subject_selection_meta_id_fk" FOREIGN KEY ("source_subject_selection_meta_id_fk") REFERENCES "public"."subject_selection_meta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subject_selection_meta_sources_meta_id_idx" ON "subject_selection_meta_sources" USING btree ("subject_selection_meta_id_fk");