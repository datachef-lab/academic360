-- Hardened 2026-08-07: guard against parent tables missing (dev DB may
-- be behind — bare ALTER TABLE fails 42P01 if the table isn't there yet).
-- Requires BOTH temp_admit_card_distributions AND document_ledger.
DO $$ BEGIN
    IF to_regclass('public.temp_admit_card_distributions') IS NOT NULL
       AND to_regclass('public.document_ledger') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "temp_admit_card_distributions" ADD COLUMN IF NOT EXISTS "document_ledger_id_fk" integer';

        BEGIN
            EXECUTE 'ALTER TABLE "temp_admit_card_distributions"
                ADD CONSTRAINT "temp_admit_card_distributions_document_ledger_id_fk_document_ledger_id_fk"
                FOREIGN KEY ("document_ledger_id_fk") REFERENCES "public"."document_ledger"("id")
                ON DELETE NO ACTION ON UPDATE NO ACTION';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;

        BEGIN
            EXECUTE 'ALTER TABLE "temp_admit_card_distributions"
                ADD CONSTRAINT "temp_admit_card_distributions_document_ledger_id_fk_unique"
                UNIQUE ("document_ledger_id_fk")';
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END;
    END IF;
END $$;