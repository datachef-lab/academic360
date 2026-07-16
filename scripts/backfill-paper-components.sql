-- Backfill paper_components for papers that have none, propagating along the
-- previous_paper_id chain that links the "same" paper across academic years.
--
-- Component data was first entered for the origin year (e.g. 2025-26). Newer
-- years are created forward (new.previous_paper_id_fk = source.id); older years
-- were added later as back-linked copies. So we propagate components in BOTH
-- directions and loop until nothing changes:
--   forward : copy from my previous_paper  (fills newer years from older)
--   backward: copy to my previous_paper    (fills older years from newer)
--
-- Idempotent + insert-only (a paper that already has any component is skipped).
-- Run per environment, e.g.:
--   sudo -u postgres psql -d <db> -v ON_ERROR_STOP=1 -f - < scripts/backfill-paper-components.sql

\echo '== papers missing components BEFORE =='
SELECT count(*) AS papers_missing_components
FROM papers p
WHERE NOT EXISTS (SELECT 1 FROM paper_components c WHERE c.paper_id_fk = p.id);

DO $$
DECLARE
  pass_inserts integer;
  n integer;
BEGIN
  LOOP
    pass_inserts := 0;

    -- forward: a paper inherits its previous_paper's components
    INSERT INTO paper_components (paper_id_fk, exam_component_id_fk, full_marks, credit, created_at, updated_at)
    SELECT np.id, pc.exam_component_id_fk, pc.full_marks, pc.credit, now(), now()
    FROM papers np
    JOIN paper_components pc ON pc.paper_id_fk = np.previous_paper_id_fk
    WHERE np.previous_paper_id_fk IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM paper_components x WHERE x.paper_id_fk = np.id);
    GET DIAGNOSTICS n = ROW_COUNT;
    pass_inserts := pass_inserts + n;

    -- backward: a paper's previous_paper inherits this paper's components
    INSERT INTO paper_components (paper_id_fk, exam_component_id_fk, full_marks, credit, created_at, updated_at)
    SELECT src.previous_paper_id_fk, pc.exam_component_id_fk, pc.full_marks, pc.credit, now(), now()
    FROM papers src
    JOIN paper_components pc ON pc.paper_id_fk = src.id
    WHERE src.previous_paper_id_fk IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM paper_components x WHERE x.paper_id_fk = src.previous_paper_id_fk);
    GET DIAGNOSTICS n = ROW_COUNT;
    pass_inserts := pass_inserts + n;

    EXIT WHEN pass_inserts = 0;
  END LOOP;
END $$;

\echo '== papers missing components AFTER =='
SELECT count(*) AS papers_missing_components
FROM papers p
WHERE NOT EXISTS (SELECT 1 FROM paper_components c WHERE c.paper_id_fk = p.id);

-- Any rows still listed AFTER have no component-bearing paper anywhere in their
-- previous_paper_id chain (no origin-year data to inherit from).
