-- Lookup indexes for the Student Ledger page.
--
-- The passbook query filters like:
--
--   SELECT ...
--   FROM document_ledger dl
--   JOIN promotions p ON p.id = dl.promotion_id_fk
--   ...
--   WHERE p.student_id_fk = $1
--
-- `promotions.student_id_fk` is already indexed (0164), so Postgres finds the
-- student's promotions quickly. The join back onto `document_ledger` on
-- `promotion_id_fk` was uncovered, forcing a scan of the full ledger — this
-- is the passbook load's dominant cost on any student with more than a handful
-- of entries.
--
-- The archived-batch filter also joins `document_batch_receipts` — an index
-- on that FK helps the same page and other future ledger-by-batch views.
--
-- Idempotent so it can be reapplied without failing on a DB that already
-- carries the index.

CREATE INDEX IF NOT EXISTS "document_ledger_promotion_id_idx"
  ON "document_ledger" ("promotion_id_fk");

CREATE INDEX IF NOT EXISTS "document_ledger_batch_receipt_id_idx"
  ON "document_ledger" ("document_batch_receipt_id_fk");

CREATE INDEX IF NOT EXISTS "document_ledger_document_type_id_idx"
  ON "document_ledger" ("document_type_id_fk");
