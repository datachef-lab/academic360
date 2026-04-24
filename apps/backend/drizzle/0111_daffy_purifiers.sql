ALTER TABLE "certificate_field_master" RENAME COLUMN "is_semester_field_required" TO "is_question";--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'certificate_field_master_type'
      AND e.enumlabel = 'INPUT'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'certificate_field_master_type'
      AND e.enumlabel = 'TEXT'
  ) THEN
    ALTER TYPE "public"."certificate_field_master_type" RENAME VALUE 'INPUT' TO 'TEXT';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "certificate_field_master" ALTER COLUMN "type" SET DEFAULT 'TEXT';--> statement-breakpoint