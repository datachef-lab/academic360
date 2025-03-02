ALTER TABLE "subject_metadatas" ALTER COLUMN "irp_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "papers" ADD COLUMN "display_name" varchar(500);--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD COLUMN "irp_name" varchar(500);--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD COLUMN "name" varchar(500);