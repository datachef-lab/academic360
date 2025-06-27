CREATE TABLE "fees_slab_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"fees_structure_id_fk" integer NOT NULL,
	"fees_slab_id_fk" integer NOT NULL,
	"fee_concession_rate" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fees_slab_mapping" ADD CONSTRAINT "fees_slab_mapping_fees_structure_id_fk_academic_years_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_slab_mapping" ADD CONSTRAINT "fees_slab_mapping_fees_slab_id_fk_fees_slab_id_fk" FOREIGN KEY ("fees_slab_id_fk") REFERENCES "public"."fees_slab"("id") ON DELETE no action ON UPDATE no action;