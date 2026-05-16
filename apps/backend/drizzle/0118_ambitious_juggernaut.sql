-- Idempotent: safe if enums / tables / constraints already exist (partial migrate or drift)

DO $$ BEGIN
  CREATE TYPE "public"."class_track_type" AS ENUM('ODD', 'EVEN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."promotion_builder_logic_type" AS ENUM('AUTO_PROMOTE', 'CONDITIONAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."promotion_builder_operator" AS ENUM('EQUALS', 'NONE_IN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "promotion_builder_clause_class_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"promotion_builder_clause_id_fk" integer NOT NULL,
	"promotion_clause_class_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_promotion_builder_clause_class" UNIQUE("promotion_builder_clause_id_fk","promotion_clause_class_id_fk")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "promotion_builder_clause_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"promotion_builder_id_fk" integer NOT NULL,
	"promotion_clause_id_fk" integer NOT NULL,
	"operator" "promotion_builder_operator" DEFAULT 'EQUALS' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_promotion_builder_clause" UNIQUE("promotion_builder_id_fk","promotion_clause_id_fk")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "promotion_builder" (
	"id" serial PRIMARY KEY NOT NULL,
	"affiliation_id_fk" integer NOT NULL,
	"logic" "promotion_builder_logic_type" DEFAULT 'AUTO_PROMOTE' NOT NULL,
	"target_class_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "promotion_clause_class_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"promotion_clause_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_promotion_clause_class" UNIQUE("promotion_clause_id_fk","class_id_fk")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "promotion_clause" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"color" varchar,
	"bg_color" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_type t ON t.oid = a.atttypid
    WHERE n.nspname = 'public'
      AND c.relname = 'payments'
      AND a.attname = 'created_at'
      AND NOT a.attisdropped
      AND t.typname = 'timestamp'
  ) THEN
    ALTER TABLE "payments" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING ("created_at" AT TIME ZONE 'Asia/Kolkata');
  END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_type t ON t.oid = a.atttypid
    WHERE n.nspname = 'public'
      AND c.relname = 'payments'
      AND a.attname = 'updated_at'
      AND NOT a.attisdropped
      AND t.typname = 'timestamp'
  ) THEN
    ALTER TABLE "payments" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING ("updated_at" AT TIME ZONE 'Asia/Kolkata');
  END IF;
END $$;--> statement-breakpoint

ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "track" "class_track_type";--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "promotion_builder_clause_class_mapping" ADD CONSTRAINT "promotion_builder_clause_class_mapping_promotion_builder_clause_id_fk_promotion_builder_clause_mapping_id_fk" FOREIGN KEY ("promotion_builder_clause_id_fk") REFERENCES "public"."promotion_builder_clause_mapping"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "promotion_builder_clause_class_mapping" ADD CONSTRAINT "promotion_builder_clause_class_mapping_promotion_clause_class_id_fk_promotion_clause_class_mapping_id_fk" FOREIGN KEY ("promotion_clause_class_id_fk") REFERENCES "public"."promotion_clause_class_mapping"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "promotion_builder_clause_mapping" ADD CONSTRAINT "promotion_builder_clause_mapping_promotion_builder_id_fk_promotion_builder_id_fk" FOREIGN KEY ("promotion_builder_id_fk") REFERENCES "public"."promotion_builder"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "promotion_builder_clause_mapping" ADD CONSTRAINT "promotion_builder_clause_mapping_promotion_clause_id_fk_promotion_clause_id_fk" FOREIGN KEY ("promotion_clause_id_fk") REFERENCES "public"."promotion_clause"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "promotion_builder" ADD CONSTRAINT "promotion_builder_affiliation_id_fk_affiliations_id_fk" FOREIGN KEY ("affiliation_id_fk") REFERENCES "public"."affiliations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "promotion_builder" ADD CONSTRAINT "promotion_builder_target_class_id_fk_classes_id_fk" FOREIGN KEY ("target_class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "promotion_clause_class_mapping" ADD CONSTRAINT "promotion_clause_class_mapping_promotion_clause_id_fk_promotion_clause_id_fk" FOREIGN KEY ("promotion_clause_id_fk") REFERENCES "public"."promotion_clause"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "promotion_clause_class_mapping" ADD CONSTRAINT "promotion_clause_class_mapping_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
