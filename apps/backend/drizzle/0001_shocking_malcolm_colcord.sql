CREATE TYPE "public"."shift_type" AS ENUM('MORNING', 'AFTERNOON', 'EVENING');--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "shift" "shift_type";