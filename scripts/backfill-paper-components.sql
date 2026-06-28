-- Backfill paper_components for papers created by the academic-year copy wizard
-- before the wizard copied components (see academic-year-copy.service.ts).
--
-- A copied paper has previous_paper_id_fk = the source paper it was cloned from.
-- For every paper that currently has NO components, copy the components from its
-- source paper. Idempotent (NOT EXISTS guard) and safe to run repeatedly; only
-- inserts, never deletes/updates.
--
-- Run per environment, e.g.:
--   docker compose -f docker-compose.yml exec -T postgres \
--     psql -U <user> -d <db> -v ON_ERROR_STOP=1 -f - < scripts/backfill-paper-components.sql

\echo '== papers missing components BEFORE =='
SELECT count(*) AS papers_missing_components
FROM papers p
WHERE NOT EXISTS (SELECT 1 FROM paper_components c WHERE c.paper_id_fk = p.id);

INSERT INTO paper_components (paper_id_fk, exam_component_id_fk, full_marks, credit, created_at, updated_at)
SELECT np.id, pc.exam_component_id_fk, pc.full_marks, pc.credit, now(), now()
FROM papers np
JOIN paper_components pc ON pc.paper_id_fk = np.previous_paper_id_fk
WHERE np.previous_paper_id_fk IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM paper_components x WHERE x.paper_id_fk = np.id
  );

\echo '== papers missing components AFTER =='
SELECT count(*) AS papers_missing_components
FROM papers p
WHERE NOT EXISTS (SELECT 1 FROM paper_components c WHERE c.paper_id_fk = p.id);

-- NOTE: a paper only gets backfilled if its DIRECT source paper has components.
-- If a year was itself created by the (old) wizard, its papers may also be empty,
-- so the rows still listed AFTER have no component-bearing direct ancestor — run
-- this again after backfilling the older year, or walk the previous_paper_id chain.
