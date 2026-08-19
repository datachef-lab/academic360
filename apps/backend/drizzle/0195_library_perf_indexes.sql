-- Library performance indexes — 2026-08-19 prod incident follow-up.
--
-- copy_details / books / book_circulation / library_entry_exit carried ONLY
-- their primary-key indexes: every search, join and aggregate on them was a
-- sequential scan at ~200k-row scale, which is what pinned RDS at 99% CPU
-- (48-97s circulation searches under concurrent desk usage).
--
-- Hand-authored (not drizzle-kit generated) on the same precedent as 0189/0191:
-- fully idempotent, no snapshot file (indexes are not mirrored in the drizzle
-- models, so schema diffing is unaffected). Numbered 0195 to follow main's last
-- migration 0194 with no gap. NOTE for a future merge-down to develop: develop
-- independently uses 0195_service_requests, so this file must be renumbered
-- (to develop's next free number) before it lands there — a same-number/
-- different-content collision would break drizzle's linear journal (ADR 0028).
-- That reconciliation is intentionally deferred to the develop merge.
--
-- The composed-accession trigram index matches the `composedAccessNumber`
-- expression that exists on develop's book-circulation.service.ts. On main the
-- index is inert (main searches the plain column, served by the plain-column
-- trigram index below); after merge-down it accelerates develop's composed
-- search with no further change. Postgres matches expression indexes
-- structurally, so quoting/whitespace differences are irrelevant.
--
-- Lock note: plain CREATE INDEX takes a SHARE lock (blocks writes, not reads)
-- for the build — seconds at this scale; CONCURRENTLY cannot run inside the
-- migration transaction.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
DO $$ BEGIN
  IF to_regclass('public.book_circulation') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "book_circulation_user_id_idx" ON "book_circulation" ("user_id_fk")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "book_circulation_copy_details_id_idx" ON "book_circulation" ("copy_details_id_fk")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "book_circulation_issue_ts_idx" ON "book_circulation" ("issue_timestamp")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "book_circulation_actual_return_ts_idx" ON "book_circulation" ("actual_return_timestamp")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "book_circulation_open_return_ts_idx" ON "book_circulation" ("return_timestamp") WHERE is_returned = false';
  END IF;
  IF to_regclass('public.book_reissue') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "book_reissue_circulation_id_idx" ON "book_reissue" ("book_circulation_id_fk")';
  END IF;
  IF to_regclass('public.copy_details') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "copy_details_book_id_idx" ON "copy_details" ("book_id_fk")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "copy_details_access_number_trgm_idx" ON "copy_details" USING gin ("access_number" gin_trgm_ops)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "copy_details_access_composed_trgm_idx" ON "copy_details" USING gin ((
      case
        when "access_number" is null then null
        else coalesce(nullif(btrim("prefix"), ''0''), '''')
          || "access_number"
          || coalesce(nullif(btrim("suffix"), ''0''), '''')
      end) gin_trgm_ops)';
  END IF;
  IF to_regclass('public.books') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "books_title_trgm_idx" ON "books" USING gin ("title" gin_trgm_ops)';
  END IF;
  IF to_regclass('public.library_entry_exit') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS "library_entry_exit_user_entry_idx" ON "library_entry_exit" ("user_id_fk", "entry_timestamp")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "library_entry_exit_entry_ts_idx" ON "library_entry_exit" ("entry_timestamp")';
  END IF;
END $$;
