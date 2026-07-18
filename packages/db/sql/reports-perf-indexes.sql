-- Report-export performance indexes.
--
-- These mirror the index() declarations added to the Drizzle model files for the
-- Reports feature. They exist as a standalone script because `drizzle-kit push`
-- creates indexes with a plain CREATE INDEX, which takes an ACCESS EXCLUSIVE-ish
-- write lock and blocks inserts/updates on large tables for the whole build.
--
-- Apply these to a live/production database instead of push:
--   * CREATE INDEX CONCURRENTLY does NOT lock writes, but it CANNOT run inside a
--     transaction block — run this file with a client that does not wrap it in a
--     transaction, e.g.  psql "$DATABASE_URL" -f reports-perf-indexes.sql
--     (psql runs each statement autocommit unless you BEGIN explicitly).
--   * IF NOT EXISTS makes this safe to re-run and safe if some already exist.
--   * If a CONCURRENTLY build fails midway it leaves an INVALID index; drop it
--     (DROP INDEX CONCURRENTLY <name>) and re-run that statement.
--
-- Verify afterwards:  SELECT indexname FROM pg_indexes WHERE indexname LIKE '%_idx';
-- and EXPLAIN ANALYZE the report queries to confirm index scans replace seq scans.

-- students: joined to users/personal_details and filtered by program course
CREATE INDEX CONCURRENTLY IF NOT EXISTS students_user_id_idx ON students (user_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS students_program_course_id_idx ON students (program_course_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS students_application_form_id_idx ON students (application_form_id_fk);

-- personal_details: LEFT JOIN on user_id_fk for every student in the roster
CREATE INDEX CONCURRENTLY IF NOT EXISTS personal_details_user_id_idx ON personal_details (user_id_fk);

-- sessions: every report scopes to an academic year through this FK
CREATE INDEX CONCURRENTLY IF NOT EXISTS sessions_academic_id_idx ON sessions (academic_id_fk);

-- promotions: roster joins to class/section/shift (student/session/program already indexed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS promotions_class_id_idx ON promotions (class_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS promotions_section_id_idx ON promotions (section_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS promotions_shift_id_idx ON promotions (shift_id_fk);

-- family_details / person: Detailed report reaches father/mother
CREATE INDEX CONCURRENTLY IF NOT EXISTS family_details_user_id_idx ON family_details (user_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS person_family_id_idx ON person (family_id_fk);

-- student_subject_selections: composite serves the batched Subject Selection lookup
-- (subject_selection_meta_id_fk = X AND student_id_fk IN (...)) that replaces the N+1
CREATE INDEX CONCURRENTLY IF NOT EXISTS student_subject_selections_meta_student_idx
  ON student_subject_selections (subject_selection_meta_id_fk, student_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS student_subject_selections_session_id_idx
  ON student_subject_selections (session_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS student_subject_selections_subject_id_idx
  ON student_subject_selections (subject_id_fk);

-- subject_selection_meta: loaded per academic year, joined by subject type
CREATE INDEX CONCURRENTLY IF NOT EXISTS subject_selection_meta_academic_year_id_idx
  ON subject_selection_meta (academic_year_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS subject_selection_meta_subject_type_id_idx
  ON subject_selection_meta (subject_type_id_fk);

-- 12th Subjects report chain: student_academic_subjects -> admission_academic_info
--   -> application_forms -> admissions -> sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS student_academic_subjects_adm_academic_info_id_idx
  ON student_academic_subjects (admission_academic_info_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS student_academic_subjects_board_subject_id_idx
  ON student_academic_subjects (board_subject_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS admission_academic_info_application_form_id_idx
  ON admission_academic_info (application_form_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS admission_academic_info_student_id_idx
  ON admission_academic_info (student_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS application_forms_admission_id_idx
  ON application_forms (admission_id_fk);
CREATE INDEX CONCURRENTLY IF NOT EXISTS admissions_session_id_idx
  ON admissions (session_id_fk);
