-- Duplicate detection for the concurrent legacy UID import. Run BEFORE any
-- test (baseline: pre-existing dups may exist) and AFTER; the DELTAS must be
-- zero. Each block returns natural-key groups occurring more than once.
SELECT 'academic_years' AS tbl, year AS key, count(*) FROM academic_years GROUP BY year HAVING count(*)>1
UNION ALL
SELECT 'sessions', academic_id_fk || '|' || lower(trim(name)), count(*) FROM sessions GROUP BY academic_id_fk, lower(trim(name)) HAVING count(*)>1
UNION ALL
SELECT 'admission_program_courses', admission_id_fk || '|' || program_course_id_fk || '|' || class_id_fk, count(*) FROM admission_program_courses GROUP BY admission_id_fk, program_course_id_fk, class_id_fk HAVING count(*)>1
UNION ALL
SELECT 'promotion_status', legacy_promotion_status_id::text, count(*) FROM promotion_status WHERE legacy_promotion_status_id IS NOT NULL GROUP BY legacy_promotion_status_id HAVING count(*)>1
UNION ALL
SELECT 'nationalities', lower(name), count(*) FROM nationality GROUP BY lower(name) HAVING count(*)>1
UNION ALL
SELECT 'boards', lower(name), count(*) FROM boards GROUP BY lower(name) HAVING count(*)>1
UNION ALL
SELECT 'shifts', lower(name), count(*) FROM shifts GROUP BY lower(name) HAVING count(*)>1
UNION ALL
SELECT 'receipt_types', lower(name), count(*) FROM receipt_types GROUP BY lower(name) HAVING count(*)>1
UNION ALL
SELECT 'fee_heads', lower(name), count(*) FROM fee_heads GROUP BY lower(name) HAVING count(*)>1
UNION ALL
SELECT 'fee_student_mappings', student_id_fk || '|' || fee_structure_id_fk, count(*) FROM fee_student_mappings GROUP BY student_id_fk, fee_structure_id_fk HAVING count(*)>1
UNION ALL
SELECT 'fee_group_promotion_mappings', fee_group_id_fk || '|' || promotion_id_fk, count(*) FROM fee_group_promotion_mappings GROUP BY fee_group_id_fk, promotion_id_fk HAVING count(*)>1
UNION ALL
SELECT 'students', uid, count(*) FROM students GROUP BY uid HAVING count(*)>1
ORDER BY 1, 2;
