ALTER TABLE "fee_structure_concession_slabs" RENAME COLUMN "fees_structure_id_fk" TO "fee_structure_id_fk";--> statement-breakpoint
ALTER TABLE "fee_structure_concession_slabs" DROP CONSTRAINT "fee_structure_concession_slabs_fees_structure_id_fk_fee_structures_id_fk";
--> statement-breakpoint
ALTER TABLE "fee_structures" ALTER COLUMN "receipt_type_id_fk" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_structure_concession_slabs" ADD CONSTRAINT "fee_structure_concession_slabs_fee_structure_id_fk_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id_fk") REFERENCES "public"."fee_structures"("id") ON DELETE no action ON UPDATE no action;