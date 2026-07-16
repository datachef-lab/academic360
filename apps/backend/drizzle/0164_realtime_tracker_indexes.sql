-- Real Time Tracker performance: index the columns the affiliation
-- aggregation joins/filters on. The `promotions` table (the largest one the
-- tracker touches) previously had NO indexes at all, forcing a full scan per
-- request. All idempotent so this is safe to (re)apply on drifted DBs.
CREATE INDEX IF NOT EXISTS "promotions_program_course_id_idx" ON "promotions" ("program_course_id_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotions_student_id_idx" ON "promotions" ("student_id_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotions_session_id_idx" ON "promotions" ("session_id_fk");--> statement-breakpoint
-- Partial index matching ACTIVE_PROMOTION_SQL (end_date IS NULL AND
-- COALESCE(is_deprecated,false)=false) so the tracker scans only current rows.
CREATE INDEX IF NOT EXISTS "promotions_active_idx" ON "promotions" ("program_course_id_fk", "student_id_fk") WHERE "end_date" is null and coalesce("is_deprecated", false) = false;--> statement-breakpoint
-- Partial index matching SUBJECT_SELECTION_EXISTS_SQL (student_id_fk = X AND is_active = TRUE).
CREATE INDEX IF NOT EXISTS "student_subject_selections_student_active_idx" ON "student_subject_selections" ("student_id_fk") WHERE "is_active" = true;--> statement-breakpoint
-- The CU-registration EXISTS/joins correlate on student_id_fk.
CREATE INDEX IF NOT EXISTS "cu_registration_correction_requests_student_id_idx" ON "cu_registration_correction_requests" ("student_id_fk");
