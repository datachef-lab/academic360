CREATE TABLE "fees_slab_academic_year_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"fees_slab_id_fk" integer NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"fee_concession_rate" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fees_structures" RENAME COLUMN "online_date_from" TO "online_start_date";--> statement-breakpoint
ALTER TABLE "fees_structures" RENAME COLUMN "online_date_to" TO "online_end_date";--> statement-breakpoint
ALTER TABLE "fees_structures" RENAME COLUMN "instalment_from_date" TO "instalment_start_date";--> statement-breakpoint
ALTER TABLE "fees_structures" RENAME COLUMN "instalment_to_date" TO "instalment_end_date";--> statement-breakpoint
ALTER TABLE "fees_structures" DROP CONSTRAINT "fees_structures_fees_slab_id_fk_fees_slab_id_fk";
--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ADD COLUMN "base_amount" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ADD COLUMN "total_payable" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fees_slab_academic_year_mapping" ADD CONSTRAINT "fees_slab_academic_year_mapping_fees_slab_id_fk_fees_slab_id_fk" FOREIGN KEY ("fees_slab_id_fk") REFERENCES "public"."fees_slab"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_slab_academic_year_mapping" ADD CONSTRAINT "fees_slab_academic_year_mapping_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_components" DROP COLUMN "concession_amount";--> statement-breakpoint
ALTER TABLE "fees_structures" DROP COLUMN "fees_slab_id_fk";