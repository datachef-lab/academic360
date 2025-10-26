ALTER TABLE "public"."person" ALTER COLUMN "person_title_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."person_title_type";--> statement-breakpoint
CREATE TYPE "public"."person_title_type" AS ENUM('MR.', 'MRS.', 'MS.', 'DR.', 'PROF.', 'REV.', 'OTHER.', 'LATE', 'MR', 'MRS', 'MS', 'DR', 'PROF', 'REV', 'OTHER');--> statement-breakpoint
ALTER TABLE "public"."person" ALTER COLUMN "person_title_type" SET DATA TYPE "public"."person_title_type" USING "person_title_type"::"public"."person_title_type";