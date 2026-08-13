-- MANUAL REPAIR SCRIPT — run against any DB where docs-module migrations
-- 0175/0176/0177/0178 were silently skipped. Fully idempotent: every
-- statement guards on existence (to_regclass / IF NOT EXISTS / DO EXCEPTION
-- duplicate_object). Safe to run repeatedly. Not committed to migrations —
-- run manually via:
--
--   psql "$DATABASE_URL" -f apps/backend/drizzle/manual-repair-docs-module.sql
--
-- After running, backend queries against document_types etc. will work.
-- __drizzle_migrations table is NOT touched — drizzle-kit migrate on the
-- next boot will still think these need applying (fine — they'll all be
-- no-ops thanks to the guards).

-- =========================================================================
-- ENUMS (0175 introduced these; some code paths reference them)
-- =========================================================================

DO $$ BEGIN
    CREATE TYPE "public"."document_domain" AS ENUM(
        'ADMISSION', 'ENROLMENT', 'PRE_CU_REGISTRATION', 'POST_CU_REGISTRATION',
        'EXAM', 'FEES', 'LIBRARY', 'OTHER'
    );
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."document_category" AS ENUM(
        'EXAM_LINKED', 'ADMINISTRATIVE', 'UPLOAD', 'SYSTEM_GENERATED'
    );
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."document_eligibility_rule" AS ENUM(
        'FORM_FILLUP_RECORDED', 'RCSI_RECORDED'
    );
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."document_ledger_status" AS ENUM(
        'UPLOADED', 'PENDING', 'ON_HOLD', 'COLLECTED', 'WAIVED', 'EXPECTED', 'NO_CHANGE'
    );
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."issuing_authority" AS ENUM('UNIVERSITY', 'COLLEGE');
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "public"."document_batch_receipt_mode" AS ENUM(
        'EXAM_LINKED', 'ADMINISTRATIVE'
    );
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

-- =========================================================================
-- 0175 STEP 1 — Rename documents → document_types (if the old name exists)
-- =========================================================================

DO $$ BEGIN
    IF to_regclass('public.documents') IS NOT NULL
       AND to_regclass('public.document_types') IS NULL THEN
        ALTER TABLE "documents" RENAME TO "document_types";
    END IF;
END $$;

-- Drop OLD constraint names (survivors of the rename) if they still exist.
DO $$ BEGIN
    IF to_regclass('public.document_types') IS NOT NULL THEN
        BEGIN EXECUTE 'ALTER TABLE "document_types" DROP CONSTRAINT "documents_name_unique"';
        EXCEPTION WHEN undefined_object THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_types" DROP CONSTRAINT "documents_sequence_unique"';
        EXCEPTION WHEN undefined_object THEN NULL; END;
    END IF;
END $$;

DO $$ BEGIN
    IF to_regclass('public.cu_registration_document_uploads') IS NOT NULL THEN
        BEGIN
            EXECUTE 'ALTER TABLE "cu_registration_document_uploads" DROP CONSTRAINT "cu_registration_document_uploads_document_id_fk_documents_id_fk"';
        EXCEPTION WHEN undefined_object THEN NULL; END;
    END IF;
END $$;

-- =========================================================================
-- 0175 STEP 2 — Add all columns to document_types (each IF NOT EXISTS)
-- =========================================================================

DO $$ BEGIN
    IF to_regclass('public.document_types') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "document_types" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone';
        EXECUTE 'ALTER TABLE "document_types" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone';
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "domain" "document_domain" DEFAULT ''OTHER'' NOT NULL';
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "issuing_authority" "issuing_authority"';
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "category" "document_category" DEFAULT ''ADMINISTRATIVE'' NOT NULL';
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "eligibility_rule" "document_eligibility_rule"';
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "requires_fee_clearance" boolean DEFAULT false NOT NULL';
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "requires_library_clearance" boolean DEFAULT false NOT NULL';
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "is_recurring" boolean DEFAULT false NOT NULL';
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "bg_color" varchar(255)';
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "text_color" varchar(255)';

        -- 0177 addition
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "code" varchar(64)';

        -- Backfill code for the seeded types before making it NOT NULL
        UPDATE "document_types" SET "code" = CASE "name"
            WHEN 'Exam Admit Card'     THEN 'EXAM_ADMIT_CARD'
            WHEN 'Fee Receipt'         THEN 'FEE_RECEIPT'
            WHEN 'CU Registration PDF' THEN 'CU_REGISTRATION_PDF'
            WHEN 'ID Card'             THEN 'ID_CARD'
            WHEN 'CU Exam Form'        THEN 'CU_EXAM_FORM'
            WHEN 'Class XII Marksheet' THEN 'CLASS_XII_MARKSHEET'
            WHEN 'Aadhaar Card'        THEN 'AADHAAR_CARD'
            WHEN 'APAAR ID Card'       THEN 'APAAR_ID_CARD'
            WHEN 'Father Photo ID'     THEN 'FATHER_PHOTO_ID'
            WHEN 'Mother Photo ID'     THEN 'MOTHER_PHOTO_ID'
            WHEN 'EWS Certificate'     THEN 'EWS_CERTIFICATE'
            ELSE left(regexp_replace(upper(trim("name")), '[^A-Z0-9]+', '_', 'g'), 64)
        END
        WHERE "code" IS NULL;

        BEGIN EXECUTE 'ALTER TABLE "document_types" ALTER COLUMN "code" SET NOT NULL';
        EXCEPTION WHEN others THEN NULL; END;

        BEGIN EXECUTE 'ALTER TABLE "document_types" ADD CONSTRAINT "document_types_code_unique" UNIQUE ("code")';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;

        BEGIN EXECUTE 'ALTER TABLE "document_types" ADD CONSTRAINT "document_types_name_unique" UNIQUE ("name")';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;

        BEGIN EXECUTE 'ALTER TABLE "document_types" ADD CONSTRAINT "document_types_sequence_unique" UNIQUE ("sequence")';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
    END IF;
END $$;

-- =========================================================================
-- 0175 STEP 3 — Create related tables (document_batch_receipts etc.)
-- =========================================================================

CREATE TABLE IF NOT EXISTS "document_batch_receipts" (
    "id" serial PRIMARY KEY NOT NULL,
    "document_type_id_fk" integer NOT NULL,
    "name" varchar(1000) NOT NULL,
    "academic_year_id_fk" integer NOT NULL,
    "class_id_fk" integer NOT NULL,
    "appear_type_id_fk" integer,
    "expected_arrival_date" timestamp with time zone,
    "available_from_date" timestamp with time zone,
    "created_by_user_id_fk" integer NOT NULL,
    "updated_by_user_id_fk" integer NOT NULL,
    "documents_received_by_user_id_fk" integer,
    "documents_received_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 0188 addition
DO $$ BEGIN
    IF to_regclass('public.document_batch_receipts') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "document_batch_receipts" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false NOT NULL';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "document_batch_receipt_program_courses" (
    "id" serial PRIMARY KEY NOT NULL,
    "document_batch_receipt_id_fk" integer NOT NULL,
    "program_course_id_fk" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "document_ledger" (
    "id" serial PRIMARY KEY NOT NULL,
    "document_type_id_fk" integer NOT NULL,
    "document_batch_receipt_id_fk" integer,
    "promotion_id_fk" integer NOT NULL,
    "is_self_sourced" boolean NOT NULL,
    "status" "document_ledger_status" NOT NULL,
    "link" text,
    "collected_at" timestamp with time zone,
    "provided_by_fk" integer,
    "is_overridden" boolean DEFAULT false,
    "override_reason" varchar(1000),
    "override_by_fk" integer,
    "overridden_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "document_batch_receipt_modes" (
    "id" serial PRIMARY KEY NOT NULL,
    "document_batch_receipt_id_fk" integer NOT NULL,
    "mode" "document_batch_receipt_mode" DEFAULT 'ADMINISTRATIVE' NOT NULL,
    "is_enabled" boolean DEFAULT false,
    "notify_student" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "document_batch_receipt_mode" UNIQUE ("document_batch_receipt_id_fk", "mode")
);

-- =========================================================================
-- FOREIGN KEYS (all guarded via DO EXCEPTION duplicate_object)
-- =========================================================================

DO $$ BEGIN
    IF to_regclass('public.document_batch_receipts') IS NOT NULL AND to_regclass('public.document_types') IS NOT NULL THEN
        BEGIN EXECUTE 'ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_document_type_id_fk_document_types_id_fk" FOREIGN KEY ("document_type_id_fk") REFERENCES "public"."document_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_documents_received_by_user_id_fk_users_id_fk" FOREIGN KEY ("documents_received_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
    END IF;
END $$;

DO $$ BEGIN
    IF to_regclass('public.document_batch_receipt_program_courses') IS NOT NULL THEN
        BEGIN EXECUTE 'ALTER TABLE "document_batch_receipt_program_courses" ADD CONSTRAINT "document_batch_receipt_program_courses_document_batch_receipt_id_fk_document_batch_receipts_id_fk" FOREIGN KEY ("document_batch_receipt_id_fk") REFERENCES "public"."document_batch_receipts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_batch_receipt_program_courses" ADD CONSTRAINT "document_batch_receipt_program_courses_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
    END IF;
END $$;

DO $$ BEGIN
    IF to_regclass('public.document_ledger') IS NOT NULL THEN
        BEGIN EXECUTE 'ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_document_type_id_fk_document_types_id_fk" FOREIGN KEY ("document_type_id_fk") REFERENCES "public"."document_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_document_batch_receipt_id_fk_document_batch_receipts_id_fk" FOREIGN KEY ("document_batch_receipt_id_fk") REFERENCES "public"."document_batch_receipts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_promotion_id_fk_promotions_id_fk" FOREIGN KEY ("promotion_id_fk") REFERENCES "public"."promotions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_provided_by_fk_users_id_fk" FOREIGN KEY ("provided_by_fk") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_override_by_fk_users_id_fk" FOREIGN KEY ("override_by_fk") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;

        -- 0189 indexes
        EXECUTE 'CREATE INDEX IF NOT EXISTS "document_ledger_promotion_id_idx" ON "document_ledger" ("promotion_id_fk")';
        EXECUTE 'CREATE INDEX IF NOT EXISTS "document_ledger_batch_receipt_id_idx" ON "document_ledger" ("document_batch_receipt_id_fk")';
        EXECUTE 'CREATE INDEX IF NOT EXISTS "document_ledger_document_type_id_idx" ON "document_ledger" ("document_type_id_fk")';
    END IF;
END $$;

DO $$ BEGIN
    IF to_regclass('public.document_batch_receipt_modes') IS NOT NULL AND to_regclass('public.document_batch_receipts') IS NOT NULL THEN
        BEGIN EXECUTE 'ALTER TABLE "document_batch_receipt_modes" ADD CONSTRAINT "document_batch_receipt_modes_document_batch_receipt_id_fk_document_batch_receipts_id_fk" FOREIGN KEY ("document_batch_receipt_id_fk") REFERENCES "public"."document_batch_receipts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
    END IF;
END $$;

-- =========================================================================
-- 0177 + 0178 — id_card_issues + cu_registration_document_uploads FKs
-- =========================================================================

DO $$ BEGIN
    IF to_regclass('public.id_card_issues') IS NOT NULL AND to_regclass('public.document_ledger') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "id_card_issues" ADD COLUMN IF NOT EXISTS "document_ledger_id_fk" integer';
        BEGIN EXECUTE 'ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_document_ledger_id_fk_document_ledger_id_fk" FOREIGN KEY ("document_ledger_id_fk") REFERENCES "public"."document_ledger"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_document_ledger_id_fk_unique" UNIQUE ("document_ledger_id_fk")';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
    END IF;
END $$;

DO $$ BEGIN
    IF to_regclass('public.cu_registration_document_uploads') IS NOT NULL AND to_regclass('public.document_ledger') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "cu_registration_document_uploads" ADD COLUMN IF NOT EXISTS "document_ledger_id_fk" integer';
        BEGIN EXECUTE 'ALTER TABLE "cu_registration_document_uploads" ADD CONSTRAINT "cu_registration_document_uploads_document_ledger_id_fk_document_ledger_id_fk" FOREIGN KEY ("document_ledger_id_fk") REFERENCES "public"."document_ledger"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "cu_registration_document_uploads" ADD CONSTRAINT "cu_registration_document_uploads_document_ledger_id_fk_unique" UNIQUE ("document_ledger_id_fk")';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;

        -- Restore the FK from cu_registration_document_uploads → document_types
        -- (was on documents, dropped in 0175 STEP 1, needs to be re-added targeting the new name)
        BEGIN EXECUTE 'ALTER TABLE "cu_registration_document_uploads" ADD CONSTRAINT "cu_registration_document_uploads_document_id_fk_document_types_id_fk" FOREIGN KEY ("document_id_fk") REFERENCES "public"."document_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
    END IF;
END $$;

-- =========================================================================
-- 0190 — temp_admit_card_distributions FK to document_ledger
-- =========================================================================

DO $$ BEGIN
    IF to_regclass('public.temp_admit_card_distributions') IS NOT NULL AND to_regclass('public.document_ledger') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "temp_admit_card_distributions" ADD COLUMN IF NOT EXISTS "document_ledger_id_fk" integer';
        BEGIN EXECUTE 'ALTER TABLE "temp_admit_card_distributions" ADD CONSTRAINT "temp_admit_card_distributions_document_ledger_id_fk_document_ledger_id_fk" FOREIGN KEY ("document_ledger_id_fk") REFERENCES "public"."document_ledger"("id") ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
        BEGIN EXECUTE 'ALTER TABLE "temp_admit_card_distributions" ADD CONSTRAINT "temp_admit_card_distributions_document_ledger_id_fk_unique" UNIQUE ("document_ledger_id_fk")';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
    END IF;
END $$;

-- =========================================================================
