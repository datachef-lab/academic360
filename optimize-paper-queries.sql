-- Database optimization for paper queries
-- These indexes will dramatically improve join performance

-- Primary indexes for foreign keys (most critical)
CREATE INDEX IF NOT EXISTS idx_papers_subject_id ON papers(subject_id_fk);
CREATE INDEX IF NOT EXISTS idx_papers_affiliation_id ON papers(affiliation_id_fk);
CREATE INDEX IF NOT EXISTS idx_papers_regulation_type_id ON papers(regulation_type_id_fk);
CREATE INDEX IF NOT EXISTS idx_papers_academic_year_id ON papers(academic_year_id_fk);
CREATE INDEX IF NOT EXISTS idx_papers_subject_type_id ON papers(subject_type_id_fk);
CREATE INDEX IF NOT EXISTS idx_papers_program_course_id ON papers(programe_course_id_fk);
CREATE INDEX IF NOT EXISTS idx_papers_class_id ON papers(class_id_fk);

-- Indexes for search functionality
CREATE INDEX IF NOT EXISTS idx_papers_name ON papers(name);
CREATE INDEX IF NOT EXISTS idx_papers_code ON papers(code);
CREATE INDEX IF NOT EXISTS idx_papers_is_optional ON papers(is_optional);

-- Indexes for ordering
CREATE INDEX IF NOT EXISTS idx_papers_created_at ON papers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_papers_id ON papers(id DESC);

-- Indexes for related tables (to speed up joins)
CREATE INDEX IF NOT EXISTS idx_subjects_id ON subjects(id);
CREATE INDEX IF NOT EXISTS idx_affiliations_id ON affiliations(id);
CREATE INDEX IF NOT EXISTS idx_regulation_types_id ON regulation_types(id);
CREATE INDEX IF NOT EXISTS idx_academic_years_id ON academic_years(id);
CREATE INDEX IF NOT EXISTS idx_subject_types_id ON subject_types(id);
CREATE INDEX IF NOT EXISTS idx_program_courses_id ON program_courses(id);
CREATE INDEX IF NOT EXISTS idx_classes_id ON classes(id);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_papers_filters ON papers(subject_id_fk, affiliation_id_fk, regulation_type_id_fk);
CREATE INDEX IF NOT EXISTS idx_papers_search ON papers(name, code, is_optional);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_papers_active ON papers(id) WHERE is_active = true;
