ALTER TABLE "fees_slab_mapping" DROP CONSTRAINT "fees_slab_mapping_fees_structure_id_fk_academic_years_id_fk";
--> statement-breakpoint
ALTER TABLE "fees_slab_mapping" ADD CONSTRAINT "fees_slab_mapping_fees_structure_id_fk_fees_structures_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."fees_structures"("id") ON DELETE no action ON UPDATE no action;