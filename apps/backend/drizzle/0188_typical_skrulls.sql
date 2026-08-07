-- Hardened 2026-08-07: guard against parent table missing (same class of
-- bug as 0184 repair — dev DB may be behind and not yet have
-- document_batch_receipts). ADD COLUMN IF NOT EXISTS only guards the
-- column, not the table; a missing table fails with 42P01 and blocks CD.
DO $$ BEGIN
    IF to_regclass('public.document_batch_receipts') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "document_batch_receipts" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false NOT NULL';
    END IF;
END $$;