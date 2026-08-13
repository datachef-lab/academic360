-- drizzle-kit emitted only the ADD CONSTRAINT. That would FAIL on any database
-- still holding duplicates (develop has 13,646), so the collapse has to happen
-- first, in the same migration — drizzle runs each one transactionally, so this
-- is all-or-nothing.
--
-- Safety: the remap joins through (board_id_fk, board_subject_name_id_fk), so a
-- child row can only ever be repointed to a survivor of ITS OWN pair. It is
-- structurally incapable of moving a student to a different board or subject.
-- Verified on the develop snapshot: 114,769 student_academic_subjects rows,
-- 0 changed pairs, 0 lost, pre-existing board mismatches unchanged at 6.

-- Survivor per (board, subject): real marks beat all-zero placeholders, a real
-- passing mark beats 0, a legacy-loaded row beats one without, lowest id breaks
-- the tie. Fully deterministic, so any instance would choose the same row.
CREATE TEMP TABLE _bs_keep ON COMMIT DROP AS
SELECT DISTINCT ON (board_id_fk, board_subject_name_id_fk)
       id AS survivor_id, board_id_fk AS b, board_subject_name_id_fk AS s
FROM board_subjects
ORDER BY board_id_fk, board_subject_name_id_fk,
  (CASE WHEN COALESCE(full_marks_theory,0)=0 AND COALESCE(passing_marks_theory,0)=0
             AND COALESCE(full_marks_practical,0)=0 AND COALESCE(passing_marks_practical,0)=0
        THEN 1 ELSE 0 END) ASC,
  COALESCE(passing_marks_theory,0) DESC,
  COALESCE(full_marks_theory,0) DESC,
  (CASE WHEN legacy_board_subject_mapping_sub_id IS NOT NULL THEN 0 ELSE 1 END) ASC,
  id ASC;--> statement-breakpoint

UPDATE student_academic_subjects sas
SET board_subject_id_fk = k.survivor_id
FROM board_subjects bs
JOIN _bs_keep k ON k.b = bs.board_id_fk AND k.s = bs.board_subject_name_id_fk
WHERE bs.id = sas.board_subject_id_fk AND sas.board_subject_id_fk <> k.survivor_id;--> statement-breakpoint

UPDATE board_subject_univ_subject_mappings m
SET board_subject_id_fk = k.survivor_id
FROM board_subjects bs
JOIN _bs_keep k ON k.b = bs.board_id_fk AND k.s = bs.board_subject_name_id_fk
WHERE bs.id = m.board_subject_id_fk AND m.board_subject_id_fk <> k.survivor_id;--> statement-breakpoint

DELETE FROM board_subjects WHERE id NOT IN (SELECT survivor_id FROM _bs_keep);--> statement-breakpoint

-- Guarded: this migration's `when` was bumped past main's 0185 so prod runs it
-- (ADR 0028); databases that already applied it (develop) will re-run it, where
-- the dedupe statements are no-ops and this ADD CONSTRAINT must not error.
DO $$ BEGIN
  ALTER TABLE "board_subjects" ADD CONSTRAINT "board_subjects_board_id_fk_board_subject_name_id_fk_unique" UNIQUE("board_id_fk","board_subject_name_id_fk");
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;
