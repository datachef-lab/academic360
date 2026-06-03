ALTER TABLE "fee_structure_slabs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "fee_structure_slabs" CASCADE;--> statement-breakpoint
ALTER TABLE "fee_structure_installments" RENAME COLUMN "base_amount" TO "amount";--> statement-breakpoint
ALTER TABLE "fee_student_mappings" DROP CONSTRAINT "fee_student_mappings_fee_slab_id_fk_fee_slabs_id_fk";
--> statement-breakpoint
ALTER TABLE "fee_structure_components" ADD COLUMN "amount" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_structure_components" DROP COLUMN "is_concession_applicable";--> statement-breakpoint
ALTER TABLE "fee_structure_components" DROP COLUMN "fee_head_percentage";--> statement-breakpoint
ALTER TABLE "fee_structure_components" DROP COLUMN "sequence";--> statement-breakpoint
ALTER TABLE "fee_structures" DROP COLUMN "base_amount";--> statement-breakpoint
ALTER TABLE "fee_student_mappings" DROP COLUMN "fee_slab_id_fk";