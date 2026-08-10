-- Repair for two documents migrations drizzle silently skipped.
--
-- WHY THEY WERE SKIPPED. `drizzle-kit migrate` does not track migrations
-- individually. From drizzle-orm/pg-core/dialect.cjs:
--
--     select id, hash, created_at from __drizzle_migrations
--       order by created_at desc limit 1
--     ...
--     if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis)
--
-- It reads the ONE latest applied timestamp and applies only migrations whose
-- `when` is greater. If a database ever runs a migration with a large `when`
-- before an older one arrives (a branch merged out of order), every entry with
-- a smaller `when` becomes permanently unreachable — applied never, reported
-- never. Same class of bug as 0180 (which repaired the library skips).
--
-- Confirmed on the local dev database: an unrelated migration landed at
-- when=1785495281711 between 0176 (1785415990101) and 0177 (1785477715993),
-- so 0177 and 0178 became unreachable — `drizzle-kit migrate` reported
-- "migrations applied successfully" while quietly skipping both.
--
-- WHAT IS ACTUALLY MISSING when the skip happened:
--   * document_types.code                             (from 0177)
--   * document_types_code_unique                      (from 0177)
--   * id_card_issues.document_ledger_id_fk            (from 0177)
--   * id_card_issues -> document_ledger FK + UNIQUE   (from 0177)
--   * cu_registration_document_uploads.document_ledger_id_fk  (from 0178)
--   * cu_registration_document_uploads -> document_ledger FK + UNIQUE (from 0178)
--
-- Everything below is idempotent: on a database where 0177/0178 DID apply
-- cleanly (fresh DBs, any environment that dodged the bug), each statement
-- is a no-op. On the poisoned database it closes the gap without needing a
-- separate psql step.

-- HARDENED 2026-08-07: every ALTER TABLE now guards on target-table
-- existence via `to_regclass`. The bare `ALTER TABLE "document_types" ADD
-- COLUMN IF NOT EXISTS ...` form fails with 42P01 (relation does not exist)
-- if the table itself hasn't been created yet — the IF NOT EXISTS only
-- guards the column, not the table. This bit a dev-EC2 deploy whose
-- 0175 rename (documents → document_types) never landed, blocking the
-- entire CD on a repair migration that had nothing to repair on that DB.
-- Guards make each block a no-op when the parent table is absent, letting
-- whatever creates the table later (boot service `loadDocumentTypesV2`
-- or a later migration) proceed cleanly.

-- 0177 — document_types.code (nullable → backfill → NOT NULL + UNIQUE)

DO $$ BEGIN
    IF to_regclass('public.document_types') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "document_types" ADD COLUMN IF NOT EXISTS "code" varchar(64)';

        -- Backfills only rows whose code is still NULL, matching the eleven
        -- seeded types by their canonical names; any row not in that list
        -- gets a slug of its own name (the same fallback the create path uses).
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

        BEGIN
            EXECUTE 'ALTER TABLE "document_types" ALTER COLUMN "code" SET NOT NULL';
        EXCEPTION WHEN others THEN NULL; END;

        BEGIN
            EXECUTE 'ALTER TABLE "document_types" ADD CONSTRAINT "document_types_code_unique" UNIQUE ("code")';
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END $$;--> statement-breakpoint

-- 0177 (continued) — id_card_issues.document_ledger_id_fk
-- Requires BOTH id_card_issues AND document_ledger to exist.

DO $$ BEGIN
    IF to_regclass('public.id_card_issues') IS NOT NULL
       AND to_regclass('public.document_ledger') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "id_card_issues" ADD COLUMN IF NOT EXISTS "document_ledger_id_fk" integer';

        BEGIN
            EXECUTE 'ALTER TABLE "id_card_issues"
                ADD CONSTRAINT "id_card_issues_document_ledger_id_fk_document_ledger_id_fk"
                FOREIGN KEY ("document_ledger_id_fk") REFERENCES "public"."document_ledger"("id")
                ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            EXECUTE 'ALTER TABLE "id_card_issues"
                ADD CONSTRAINT "id_card_issues_document_ledger_id_fk_unique"
                UNIQUE ("document_ledger_id_fk")';
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END $$;--> statement-breakpoint

-- 0178 — cu_registration_document_uploads.document_ledger_id_fk
-- Requires BOTH cu_registration_document_uploads AND document_ledger to exist.

DO $$ BEGIN
    IF to_regclass('public.cu_registration_document_uploads') IS NOT NULL
       AND to_regclass('public.document_ledger') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "cu_registration_document_uploads" ADD COLUMN IF NOT EXISTS "document_ledger_id_fk" integer';

        BEGIN
            EXECUTE 'ALTER TABLE "cu_registration_document_uploads"
                ADD CONSTRAINT "cu_registration_document_uploads_document_ledger_id_fk_document_ledger_id_fk"
                FOREIGN KEY ("document_ledger_id_fk") REFERENCES "public"."document_ledger"("id")
                ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            EXECUTE 'ALTER TABLE "cu_registration_document_uploads"
                ADD CONSTRAINT "cu_registration_document_uploads_document_ledger_id_fk_unique"
                UNIQUE ("document_ledger_id_fk")';
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END $$;
