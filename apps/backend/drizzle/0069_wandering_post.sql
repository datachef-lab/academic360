ALTER TABLE "fee_heads" DROP CONSTRAINT "fee_heads_sequence_unique";--> statement-breakpoint
ALTER TABLE "fee_concession_slabs" DROP CONSTRAINT "fee_concession_slabs_sequence_unique";--> statement-breakpoint
ALTER TABLE "fee_structure_components" ALTER COLUMN "sequence" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_heads" ALTER COLUMN "sequence" DROP NOT NULL;