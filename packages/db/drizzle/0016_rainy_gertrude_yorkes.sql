CREATE TABLE "subject_selection_meta_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_selection_meta_id" integer NOT NULL,
	"stream_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "subject_selection_meta" DROP CONSTRAINT "subject_selection_meta_stream_id_fk_streams_id_fk";
--> statement-breakpoint
ALTER TABLE "subject_selection_meta" ADD COLUMN "academic_year_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "subject_selection_meta_streams" ADD CONSTRAINT "subject_selection_meta_streams_subject_selection_meta_id_subject_selection_meta_id_fk" FOREIGN KEY ("subject_selection_meta_id") REFERENCES "public"."subject_selection_meta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_selection_meta_streams" ADD CONSTRAINT "subject_selection_meta_streams_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_selection_meta" ADD CONSTRAINT "subject_selection_meta_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_selection_meta" DROP COLUMN "stream_id_fk";