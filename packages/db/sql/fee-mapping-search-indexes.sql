-- Student Fee Group Mapping: server-side search/filter/pagination performance indexes.
--
-- Added when the group-promotion-mappings list endpoint moved from "fetch 10,000 rows
-- and filter in the browser" to a SQL-side search with LIMIT/OFFSET. The list query
-- joins fee_group_promotion_mappings -> promotions -> students/personal_details and
-- -> fee_groups -> fee_categories/fee_slabs, so every FK in that chain is scanned per
-- request. Postgres does not auto-index foreign keys.
--
-- Apply these to a live/production database instead of `drizzle-kit push`:
--   * CREATE INDEX CONCURRENTLY does NOT lock writes, but it CANNOT run inside a
--     transaction block — run this file with a client that does not wrap it in a
--     transaction, e.g.  psql "$DATABASE_URL" -f fee-mapping-search-indexes.sql
--   * IF NOT EXISTS makes this safe to re-run and safe if some already exist.
--   * If a CONCURRENTLY build fails midway it leaves an INVALID index; drop it
--     (DROP INDEX CONCURRENTLY <name>) and re-run that statement.
--
-- Verify afterwards:  SELECT indexname FROM pg_indexes WHERE indexname LIKE '%_idx';
-- and EXPLAIN ANALYZE the list query to confirm index scans replace seq scans.
--
-- NOTE: students/personal_details/promotions join columns are already covered by
-- reports-perf-indexes.sql and drizzle migration 0164_realtime_tracker_indexes.sql.

-- fee_group_promotion_mappings: the list query's driving table. The existing UNIQUE
-- (fee_group_id_fk, promotion_id_fk) constraint serves fee_group_id_fk lookups and the
-- composite, but not promotion_id_fk on its own.
CREATE INDEX CONCURRENTLY IF NOT EXISTS fee_group_promotion_mappings_promotion_id_idx
  ON fee_group_promotion_mappings (promotion_id_fk);

-- fee_student_mappings: batch-loaded per page to derive payment status / amounts.
CREATE INDEX CONCURRENTLY IF NOT EXISTS fee_student_mappings_fgpm_id_idx
  ON fee_student_mappings (fee_group_promotion_mapping_id_fk);

-- fee_structures: getFeeGroupTotalsForPromotions() looks structures up by the exact
-- (academic year, class, program course, shift) tuple, one OR-branch per distinct
-- promotion context. Composite ordering matches that equality predicate.
CREATE INDEX CONCURRENTLY IF NOT EXISTS fee_structures_context_idx
  ON fee_structures (academic_year_id_fk, class_id_fk, program_course_id_fk, shift_id_fk);

-- fee_structure_components: slab totals are summed per (structure, slab).
CREATE INDEX CONCURRENTLY IF NOT EXISTS fee_structure_components_structure_slab_idx
  ON fee_structure_components (fee_structure_id_fk, fee_slab_id_fk);


-- ---------------------------------------------------------------------------
-- Substring search (ILIKE '%term%')
-- ---------------------------------------------------------------------------
-- A leading wildcard cannot use a btree index — students.uid already has one via its
-- UNIQUE constraint, and it does nothing for ILIKE '%term%'. Trigram GIN indexes are
-- what make substring search indexable.
--
-- pg_trgm is NOT currently used anywhere else in this codebase. Creating an extension
-- usually requires superuser (or rds_superuser on RDS) — CONFIRM the target database
-- allows it before relying on this section. If it does not, the search still works
-- correctly, just without index support on these columns; the alternative is to anchor
-- UID/roll-number search as a prefix (term%) so the existing btrees apply.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS students_uid_trgm_idx
  ON students USING GIN (uid gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS personal_details_first_name_trgm_idx
  ON personal_details USING GIN (first_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS personal_details_middle_name_trgm_idx
  ON personal_details USING GIN (middle_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS personal_details_last_name_trgm_idx
  ON personal_details USING GIN (last_name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS promotions_roll_number_trgm_idx
  ON promotions USING GIN (roll_number gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS promotions_class_roll_number_trgm_idx
  ON promotions USING GIN (class_roll_number gin_trgm_ops);
