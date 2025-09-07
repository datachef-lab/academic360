ALTER TABLE "personal_details" RENAME COLUMN "other_nationality_id_fk" TO "other_nationality";--> statement-breakpoint
ALTER TABLE "personal_details" DROP CONSTRAINT "personal_details_other_nationality_id_fk_nationality_id_fk";
