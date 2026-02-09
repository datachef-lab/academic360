CREATE TYPE "public"."user_status_master_frequency_type" AS ENUM('ALWAYS_NEW_ENTRY', 'PER_ACADEMIC_YEAR', 'PER_SEMESTER', 'ONLY_ONCE', 'REQUIRED', 'OPTIONAL');--> statement-breakpoint
CREATE TYPE "public"."user_status_master_level_type" AS ENUM('SYSTEM', 'ACADEMIC');--> statement-breakpoint
CREATE TYPE "public"."user_status_master_type" AS ENUM('ACTIVE', 'IN_ACTIVE');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;