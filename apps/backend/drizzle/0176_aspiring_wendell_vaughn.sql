ALTER TABLE "public"."document_types" ALTER COLUMN "domain" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "public"."document_types" ALTER COLUMN "domain" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."document_domain";--> statement-breakpoint
CREATE TYPE "public"."document_domain" AS ENUM('ADMISSION', 'ENROLMENT', 'PRE_CU_REGISTRATION', 'POST_CU_REGISTRATION', 'EXAM', 'FEES', 'LIBRARY', 'OTHER');--> statement-breakpoint
ALTER TABLE "public"."document_types" ALTER COLUMN "domain" SET DATA TYPE "public"."document_domain" USING "domain"::"public"."document_domain";--> statement-breakpoint
ALTER TABLE "public"."document_types" ALTER COLUMN "domain" SET DEFAULT 'OTHER';
