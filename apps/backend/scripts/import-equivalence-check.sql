-- Per-UID row-count profile for imported students. Run after the C=1 and C=6
-- imports; the two cohorts (same course composition) should show the same
-- per-student shape (1 user, 1 personal_details, N promotions ~ semesters,
-- fee mappings where structures exist).
-- Usage: psql ... -v uids="'0604230004','0604230006'" -f import-equivalence-check.sql
SELECT
  s.uid,
  count(DISTINCT u.id)   AS users,
  count(DISTINCT pd.id)  AS personal_details,
  count(DISTINCT p.id)   AS promotions,
  count(DISTINCT aai.id) AS academic_info,
  count(DISTINCT fsm.id) AS fee_mappings,
  count(DISTINCT pay.id) AS payments
FROM students s
LEFT JOIN users u    ON u.id = s.user_id_fk
LEFT JOIN personal_details pd ON pd.user_id_fk = u.id
LEFT JOIN promotions p ON p.student_id_fk = s.id
LEFT JOIN admission_academic_info aai ON aai.user_id_fk = u.id
LEFT JOIN fee_student_mappings fsm ON fsm.student_id_fk = s.id
LEFT JOIN payments pay ON pay.fee_student_mapping_id_fk = fsm.id
WHERE s.uid IN (:uids)
GROUP BY s.uid
ORDER BY s.uid;
