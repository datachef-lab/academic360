import { pgTable, unique, serial, varchar, integer, boolean, timestamp, date, foreignKey, text, numeric, doublePrecision, time, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const admissionFormStatus = pgEnum("admission_form_status", ['DRAFT', 'PAYMENT_DUE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'WAITING_FOR_APPROVAL', 'WAITING_FOR_PAYMENT', 'WAITING_FOR_DOCUMENTS', 'DOCUMENTS_VERIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_REJECTED'])
export const admissionSteps = pgEnum("admission_steps", ['GENERAL_INFORMATION', 'ACADEMIC_INFORMATION', 'COURSE_APPLICATION', 'ADDITIONAL_INFORMATION', 'DOCUMENTS', 'PAYMENT', 'REVIEW', 'SUBMITTED'])
export const boardResultStatusType = pgEnum("board_result_status_type", ['PASS', 'FAIL IN THEORY', 'FAIL IN PRACTICAL', 'FAIL'])
export const boardResultType = pgEnum("board_result_type", ['FAIL', 'PASS'])
export const classType = pgEnum("class_type", ['YEAR', 'SEMESTER'])
export const communityType = pgEnum("community_type", ['GUJARATI', 'NON-GUJARATI'])
export const degreeLevelType = pgEnum("degree_level_type", ['SECONDARY', 'HIGHER_SECONDARY', 'UNDER_GRADUATE', 'POST_GRADUATE'])
export const disabilityType = pgEnum("disability_type", ['VISUAL', 'HEARING_IMPAIRMENT', 'VISUAL_IMPAIRMENT', 'ORTHOPEDIC', 'OTHER'])
export const frameworkType = pgEnum("framework_type", ['CCF', 'CBCS'])
export const genderType = pgEnum("gender_type", ['MALE', 'FEMALE', 'OTHER'])
export const localityType = pgEnum("locality_type", ['RURAL', 'URBAN'])
export const marksheetSource = pgEnum("marksheet_source", ['FILE_UPLOAD', 'ADDED'])
export const otpType = pgEnum("otp_type", ['FOR_PHONE', 'FOR_EMAIL'])
export const paperModeType = pgEnum("paper_mode_type", ['THEORETICAL', 'PRACTICAL', 'VIVA', 'ASSIGNMENT', 'PROJECT', 'MCQ'])
export const parentType = pgEnum("parent_type", ['BOTH', 'FATHER_ONLY', 'MOTHER_ONLY'])
export const paymentMode = pgEnum("payment_mode", ['CASH', 'CHEQUE', 'ONLINE'])
export const paymentStatus = pgEnum("payment_status", ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'])
export const personTitleType = pgEnum("person_title_type", ['MR', 'MRS', 'MS', 'DR', 'PROF', 'REV', 'OTHER'])
export const placeOfStayType = pgEnum("place_of_stay_type", ['OWN', 'HOSTEL', 'FAMILY_FRIENDS', 'PAYING_GUEST', 'RELATIVES'])
export const programmeType = pgEnum("programme_type", ['HONOURS', 'GENERAL'])
export const sportsLevel = pgEnum("sports_level", ['NATIONAL', 'STATE', 'DISTRICT', 'OTHERS'])
export const streamType = pgEnum("stream_type", ['SCIENCE', 'COMMERCE', 'HUMANITIES', 'ARTS'])
export const studentFeesMappingType = pgEnum("student_fees_mapping_type", ['FULL', 'INSTALMENT'])
export const studyMaterialAvailabilityType = pgEnum("study_material_availability_type", ['ALWAYS', 'CURRENT_SESSION_ONLY', 'COURSE_LEVEL', 'BATCH_LEVEL'])
export const studyMaterialType = pgEnum("study_material_type", ['FILE', 'LINK'])
export const studyMetaType = pgEnum("study_meta_type", ['RESOURCE', 'WORKSHEET', 'ASSIGNMENT', 'PROJECT'])
export const subjectCategoryType = pgEnum("subject_category_type", ['SPECIAL', 'COMMON', 'HONOURS', 'GENERAL', 'ELECTIVE'])
export const subjectStatus = pgEnum("subject_status", ['PASS', 'FAIL', 'AB', 'P', 'F', 'F(IN)', 'F(PR)', 'F(TH)'])
export const transportType = pgEnum("transport_type", ['BUS', 'TRAIN', 'METRO', 'AUTO', 'TAXI', 'CYCLE', 'WALKING', 'OTHER'])
export const userType = pgEnum("user_type", ['ADMIN', 'STUDENT', 'TEACHER'])


export const documents = pgTable("documents", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("documents_name_unique").on(table.name),
	unique("documents_sequence_unique").on(table.sequence),
]);

export const apps = pgTable("apps", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 700 }).notNull(),
	description: varchar({ length: 1000 }),
	icon: varchar({ length: 500 }),
	url: varchar({ length: 1000 }).notNull(),
	isActive: boolean("is_active").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const otps = pgTable("otps", {
	id: serial().primaryKey().notNull(),
	otp: varchar({ length: 6 }).notNull(),
	recipient: varchar({ length: 255 }).notNull(),
	type: otpType().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const sessions = pgTable("sessions", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	from: date().notNull(),
	to: date().notNull(),
	isCurrentSession: boolean("is_current_session").default(false).notNull(),
	codePrefix: varchar("code_prefix", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const academicYears = pgTable("academic_years", {
	id: serial().primaryKey().notNull(),
	year: varchar({ length: 4 }).notNull(),
	isCurrentYear: boolean("is_current_year").default(false).notNull(),
	sessionId: integer("session_id_fk"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "academic_years_session_id_fk_sessions_id_fk"
		}),
]);

export const batches = pgTable("batches", {
	id: serial().primaryKey().notNull(),
	academicYearId: integer("academic_year_id_fk").notNull(),
	courseId: integer("course_id_fk").notNull(),
	classId: integer("class_id_fk").notNull(),
	sectionId: integer("section_id_fk"),
	shiftId: integer("shift_id_fk"),
	sessionId: integer("session_id_fk"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "batches_academic_year_id_fk_academic_years_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "batches_course_id_fk_courses_id_fk"
		}),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "batches_class_id_fk_classes_id_fk"
		}),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [sections.id],
			name: "batches_section_id_fk_sections_id_fk"
		}),
	foreignKey({
			columns: [table.shiftId],
			foreignColumns: [shifts.id],
			name: "batches_shift_id_fk_shifts_id_fk"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "batches_session_id_fk_sessions_id_fk"
		}),
]);

export const courses = pgTable("courses", {
	id: serial().primaryKey().notNull(),
	degreeId: integer("degree_id_fk"),
	name: varchar({ length: 500 }).notNull(),
	programmeType: programmeType("programme_type"),
	shortName: varchar("short_name", { length: 500 }),
	codePrefix: varchar("code_prefix", { length: 10 }),
	universityCode: varchar("university_code", { length: 10 }),
	amount: integer(),
	numberOfSemesters: integer("number_of_semesters"),
	duration: varchar({ length: 255 }),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.degreeId],
			foreignColumns: [degree.id],
			name: "courses_degree_id_fk_degree_id_fk"
		}),
	unique("courses_sequence_unique").on(table.sequence),
]);

export const classes = pgTable("classes", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 500 }).notNull(),
	type: classType().notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("classes_sequence_unique").on(table.sequence),
]);

export const sections = pgTable("sections", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 500 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("sections_name_unique").on(table.name),
	unique("sections_sequence_unique").on(table.sequence),
]);

export const shifts = pgTable("shifts", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 500 }).notNull(),
	codePrefix: varchar("code_prefix", { length: 10 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("shifts_sequence_unique").on(table.sequence),
]);

export const batchPapers = pgTable("batch_papers", {
	id: serial().primaryKey().notNull(),
	batchId: integer("batch_id_fk").notNull(),
	subjectMetadataId: integer("subject_metadata_id_fk").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [batches.id],
			name: "batch_papers_batch_id_fk_batches_id_fk"
		}),
	foreignKey({
			columns: [table.subjectMetadataId],
			foreignColumns: [subjectMetadatas.id],
			name: "batch_papers_subject_metadata_id_fk_subject_metadatas_id_fk"
		}),
]);

export const subjectMetadatas = pgTable("subject_metadatas", {
	id: serial().primaryKey().notNull(),
	degreeId: integer("degree_id_fk").notNull(),
	programmeType: programmeType("programme_type").default('HONOURS').notNull(),
	framework: frameworkType().default('CCF').notNull(),
	classId: integer("class_id_fk").notNull(),
	specializationId: integer("specialization_id_fk"),
	category: subjectCategoryType(),
	subjectTypeId: integer("subject_type_id_fk"),
	irpName: varchar("irp_name", { length: 500 }),
	name: varchar({ length: 500 }),
	irpCode: varchar("irp_code", { length: 255 }),
	marksheetCode: varchar("marksheet_code", { length: 255 }).notNull(),
	isOptional: boolean("is_optional").default(false),
	credit: integer(),
	theoryCredit: integer("theory_credit"),
	fullMarksTheory: integer("full_marks_theory"),
	practicalCredit: integer("practical_credit"),
	fullMarksPractical: integer("full_marks_practical"),
	internalCredit: integer("internal_credit"),
	fullMarksInternal: integer("full_marks_internal"),
	projectCredit: integer("project_credit"),
	fullMarksProject: integer("full_marks_project"),
	vivalCredit: integer("vival_credit"),
	fullMarksViva: integer("full_marks_viva"),
	fullMarks: integer("full_marks").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.degreeId],
			foreignColumns: [degree.id],
			name: "subject_metadatas_degree_id_fk_degree_id_fk"
		}),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "subject_metadatas_class_id_fk_classes_id_fk"
		}),
	foreignKey({
			columns: [table.specializationId],
			foreignColumns: [specializations.id],
			name: "subject_metadatas_specialization_id_fk_specializations_id_fk"
		}),
	foreignKey({
			columns: [table.subjectTypeId],
			foreignColumns: [subjectTypes.id],
			name: "subject_metadatas_subject_type_id_fk_subject_types_id_fk"
		}),
]);

export const degree = pgTable("degree", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	level: degreeLevelType(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("degree_name_unique").on(table.name),
	unique("degree_sequence_unique").on(table.sequence),
]);

export const students = pgTable("students", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id_fk").notNull(),
	applicationId: integer("application_id_fk"),
	community: communityType(),
	handicapped: boolean().default(false),
	specializationId: integer("specialization_id_fk"),
	lastPassedYear: integer("last_passed_year"),
	notes: text(),
	active: boolean(),
	alumni: boolean(),
	isSuspended: boolean("is_suspended").default(false),
	leavingDate: timestamp("leaving_date", { mode: 'string' }),
	leavingReason: text("leaving_reason"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "students_user_id_fk_users_id_fk"
		}),
	foreignKey({
			columns: [table.applicationId],
			foreignColumns: [applicationForms.id],
			name: "students_application_id_fk_application_forms_id_fk"
		}),
	foreignKey({
			columns: [table.specializationId],
			foreignColumns: [specializations.id],
			name: "students_specialization_id_fk_specializations_id_fk"
		}),
]);

export const marksheets = pgTable("marksheets", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk").notNull(),
	classId: integer("class_id_fk").notNull(),
	year: integer().notNull(),
	sgpa: numeric(),
	cgpa: numeric(),
	classification: varchar({ length: 255 }),
	remarks: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	source: marksheetSource(),
	file: varchar({ length: 700 }),
	createdByUserId: integer("created_by_user_id").notNull(),
	updatedByUserId: integer("updated_by_user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "marksheets_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "marksheets_class_id_fk_classes_id_fk"
		}),
	foreignKey({
			columns: [table.createdByUserId],
			foreignColumns: [users.id],
			name: "marksheets_created_by_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [users.id],
			name: "marksheets_updated_by_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 500 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 255 }),
	whatsappNumber: varchar("whatsapp_number", { length: 255 }),
	image: varchar({ length: 255 }),
	type: userType().default('STUDENT'),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const offeredSubjects = pgTable("offered_subjects", {
	id: serial().primaryKey().notNull(),
	subjectMetadataId: integer("subject_metadata_id_fk").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.subjectMetadataId],
			foreignColumns: [subjectMetadatas.id],
			name: "offered_subjects_subject_metadata_id_fk_subject_metadatas_id_fk"
		}),
]);

export const papers = pgTable("papers", {
	id: serial().primaryKey().notNull(),
	offeredSubjectId: integer("offered_subject_id").notNull(),
	name: varchar({ length: 500 }),
	shortName: varchar("short_name", { length: 500 }),
	mode: paperModeType(),
	displayName: varchar("display_name", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.offeredSubjectId],
			foreignColumns: [offeredSubjects.id],
			name: "papers_offered_subject_id_offered_subjects_id_fk"
		}),
]);

export const studentPapers = pgTable("student_papers", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk").notNull(),
	batchPaperId: integer("batch_paper_id_fk").notNull(),
	batchId: integer("batch_id_fk").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_papers_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.batchPaperId],
			foreignColumns: [batchPapers.id],
			name: "student_papers_batch_paper_id_fk_batch_papers_id_fk"
		}),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [batches.id],
			name: "student_papers_batch_id_fk_batches_id_fk"
		}),
]);

export const studyMaterials = pgTable("study_materials", {
	id: serial().primaryKey().notNull(),
	availability: studyMaterialAvailabilityType().notNull(),
	subjectMetadataId: integer("subject_metadata_id_fk").notNull(),
	sessionId: integer("session_di_fk"),
	courseId: integer("course_id_fk"),
	batchId: integer("batch_id_fk"),
	type: studyMaterialType().notNull(),
	variant: studyMetaType().notNull(),
	name: varchar({ length: 700 }).notNull(),
	url: varchar({ length: 2000 }).notNull(),
	filePath: varchar("file_path", { length: 700 }),
	dueDate: timestamp("due_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.subjectMetadataId],
			foreignColumns: [subjectMetadatas.id],
			name: "study_materials_subject_metadata_id_fk_subject_metadatas_id_fk"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "study_materials_session_di_fk_sessions_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "study_materials_course_id_fk_courses_id_fk"
		}),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [batches.id],
			name: "study_materials_batch_id_fk_batches_id_fk"
		}),
]);

export const subjects = pgTable("subjects", {
	id: serial().primaryKey().notNull(),
	marksheetId: integer("marksheet_id_fk"),
	subjectMetadataId: integer("subject_metadata_id_fk"),
	year1: integer().notNull(),
	year2: integer(),
	internalMarks: integer("internal_marks"),
	internalYear: integer("internal_year"),
	internalCredit: integer("internal_credit"),
	practicalMarks: integer("practical_marks"),
	practicalYear: integer("practical_year"),
	practicalCredit: integer("practical_credit"),
	theoryMarks: integer("theory_marks"),
	theoryYear: integer("theory_year"),
	theoryCredit: integer("theory_credit"),
	totalMarks: integer("total_marks"),
	vivalMarks: integer("vival_marks"),
	vivalYear: integer("vival_year"),
	vivalCredit: integer("vival_credit"),
	projectMarks: integer("project_marks"),
	projectYear: integer("project_year"),
	projectCredit: integer("project_credit"),
	totalCredits: integer("total_credits"),
	status: subjectStatus(),
	ngp: numeric(),
	tgp: numeric(),
	letterGrade: varchar("letter_grade", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.marksheetId],
			foreignColumns: [marksheets.id],
			name: "subjects_marksheet_id_fk_marksheets_id_fk"
		}),
	foreignKey({
			columns: [table.subjectMetadataId],
			foreignColumns: [subjectMetadatas.id],
			name: "subjects_subject_metadata_id_fk_subject_metadatas_id_fk"
		}),
]);

export const specializations = pgTable("specializations", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	sequence: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("specializations_name_unique").on(table.name),
]);

export const subjectTypes = pgTable("subject_types", {
	id: serial().primaryKey().notNull(),
	irpName: varchar("irp_name", { length: 500 }),
	irpShortName: varchar("irp_short_name", { length: 500 }),
	marksheetName: varchar("marksheet_name", { length: 500 }),
	marksheetShortName: varchar("marksheet_short_name", { length: 500 }),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("subject_types_sequence_unique").on(table.sequence),
]);

export const boardUniversities = pgTable("board_universities", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 700 }).notNull(),
	degreeId: integer("degree_id"),
	passingMarks: integer("passing_marks"),
	code: varchar({ length: 255 }),
	addressId: integer("address_id"),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.degreeId],
			foreignColumns: [degree.id],
			name: "board_universities_degree_id_degree_id_fk"
		}),
	foreignKey({
			columns: [table.addressId],
			foreignColumns: [address.id],
			name: "board_universities_address_id_address_id_fk"
		}),
	unique("board_universities_name_unique").on(table.name),
	unique("board_universities_sequence_unique").on(table.sequence),
]);

export const academicSubjects = pgTable("academic_subjects", {
	id: serial().primaryKey().notNull(),
	boardUniversityId: integer("board_university_id_fk").notNull(),
	name: varchar({ length: 500 }).notNull(),
	passingMarks: integer("passing_marks"),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.boardUniversityId],
			foreignColumns: [boardUniversities.id],
			name: "academic_subjects_board_university_id_fk_board_universities_id_"
		}),
]);

export const applicationForms = pgTable("application_forms", {
	id: serial().primaryKey().notNull(),
	admissionId: integer("admission_id_fk").notNull(),
	applicationNumber: varchar("application_number", { length: 255 }),
	formStatus: admissionFormStatus("form_status").notNull(),
	admissionStep: admissionSteps("admission_step").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	remarks: text(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissions.id],
			name: "application_forms_admission_id_fk_admissions_id_fk"
		}),
]);

export const admissionAdditionalInfo = pgTable("admission_additional_info", {
	id: serial().primaryKey().notNull(),
	applicationFormId: integer("application_form_id_fk").notNull(),
	alternateMobileNumber: varchar("alternate_mobile_number", { length: 255 }),
	bloodGroupId: integer("blood_group_id_fk").notNull(),
	religionId: integer("religion_id_fk").notNull(),
	categoryId: integer("category_id_fk").notNull(),
	isPhysicallyChallenged: boolean("is_physically_challenged").default(false),
	disabilityType: disabilityType("disability_type"),
	isSingleParent: boolean("is_single_parent").default(false),
	fatherTitle: personTitleType("father_title"),
	fatherName: varchar("father_name", { length: 255 }),
	motherTitle: personTitleType("mother_title"),
	motherName: varchar("mother_name", { length: 255 }),
	isEitherParentStaff: boolean("is_either_parent_staff").default(false),
	nameOfStaffParent: varchar("name_of_staff_parent", { length: 255 }),
	departmentOfStaffParentId: integer("department_of_staff_parent_fk"),
	hasSmartphone: boolean("has_smartphone").default(false),
	hasLaptopOrDesktop: boolean("has_laptop_or_desktop").default(false),
	hasInternetAccess: boolean("has_internet_access").default(false),
	annualIncomeId: integer("annual_income_id_fk").notNull(),
	applyUnderNccCategory: boolean("apply_under_ncc_category").default(false),
	applyUnderSportsCategory: boolean("apply_under_sports_category").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.applicationFormId],
			foreignColumns: [applicationForms.id],
			name: "admission_additional_info_application_form_id_fk_application_fo"
		}),
	foreignKey({
			columns: [table.bloodGroupId],
			foreignColumns: [bloodGroup.id],
			name: "admission_additional_info_blood_group_id_fk_blood_group_id_fk"
		}),
	foreignKey({
			columns: [table.religionId],
			foreignColumns: [religion.id],
			name: "admission_additional_info_religion_id_fk_religion_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "admission_additional_info_category_id_fk_categories_id_fk"
		}),
	foreignKey({
			columns: [table.departmentOfStaffParentId],
			foreignColumns: [departments.id],
			name: "admission_additional_info_department_of_staff_parent_fk_departm"
		}),
	foreignKey({
			columns: [table.annualIncomeId],
			foreignColumns: [annualIncomes.id],
			name: "admission_additional_info_annual_income_id_fk_annual_incomes_id"
		}),
]);

export const bloodGroup = pgTable("blood_group", {
	id: serial().primaryKey().notNull(),
	type: varchar({ length: 255 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("blood_group_type_unique").on(table.type),
	unique("blood_group_sequence_unique").on(table.sequence),
]);

export const religion = pgTable("religion", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("religion_name_unique").on(table.name),
	unique("religion_sequence_unique").on(table.sequence),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	documentRequired: boolean("document_required"),
	code: varchar({ length: 10 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("categories_name_unique").on(table.name),
	unique("categories_code_unique").on(table.code),
	unique("categories_sequence_unique").on(table.sequence),
]);

export const departments = pgTable("departments", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 900 }).notNull(),
	code: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 2000 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("departments_name_unique").on(table.name),
	unique("departments_code_unique").on(table.code),
]);

export const annualIncomes = pgTable("annual_incomes", {
	id: serial().primaryKey().notNull(),
	range: varchar({ length: 255 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("annual_incomes_sequence_unique").on(table.sequence),
]);

export const admissionAcademicInfo = pgTable("admission_academic_info", {
	id: serial().primaryKey().notNull(),
	applicationFormId: integer("application_form_id_fk").notNull(),
	boardUniversityId: integer("board_university_id_fk").notNull(),
	boardResultStatus: boardResultStatusType("board_result_status").notNull(),
	rollNumber: varchar("roll_number", { length: 255 }),
	schoolNumber: varchar("school_number", { length: 255 }),
	centerNumber: varchar("center_number", { length: 255 }),
	admitCardId: varchar("admit_card_id", { length: 255 }),
	instituteId: integer("institute_id_fk"),
	otherInstitute: varchar("other_institute", { length: 500 }),
	languageMediumId: integer("language_medium_id_fk").notNull(),
	yearOfPassing: integer("year_of_passing").notNull(),
	streamType: streamType("stream_type").notNull(),
	isRegisteredForUgInCu: boolean("is_registered_for_ug_in_cu").default(false),
	cuRegistrationNumber: varchar("cu_registration_number", { length: 255 }),
	previouslyRegisteredCourseId: integer("previously_registered_course_id_fk"),
	otherPreviouslyRegisteredCourse: varchar("other_previously_registered_course", { length: 500 }),
	previousCollegeId: integer("previous_college_id_fk"),
	otherCollege: varchar("other_college", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.applicationFormId],
			foreignColumns: [applicationForms.id],
			name: "admission_academic_info_application_form_id_fk_application_form"
		}),
	foreignKey({
			columns: [table.boardUniversityId],
			foreignColumns: [boardUniversities.id],
			name: "admission_academic_info_board_university_id_fk_board_universiti"
		}),
	foreignKey({
			columns: [table.instituteId],
			foreignColumns: [institutions.id],
			name: "admission_academic_info_institute_id_fk_institutions_id_fk"
		}),
	foreignKey({
			columns: [table.languageMediumId],
			foreignColumns: [languageMedium.id],
			name: "admission_academic_info_language_medium_id_fk_language_medium_i"
		}),
	foreignKey({
			columns: [table.previouslyRegisteredCourseId],
			foreignColumns: [courses.id],
			name: "admission_academic_info_previously_registered_course_id_fk_cour"
		}),
	foreignKey({
			columns: [table.previousCollegeId],
			foreignColumns: [institutions.id],
			name: "admission_academic_info_previous_college_id_fk_institutions_id_"
		}),
]);

export const institutions = pgTable("institutions", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 700 }).notNull(),
	degreeId: integer("degree_id").notNull(),
	addressId: integer("address_id"),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.degreeId],
			foreignColumns: [degree.id],
			name: "institutions_degree_id_degree_id_fk"
		}),
	foreignKey({
			columns: [table.addressId],
			foreignColumns: [address.id],
			name: "institutions_address_id_address_id_fk"
		}),
	unique("institutions_name_unique").on(table.name),
	unique("institutions_sequence_unique").on(table.sequence),
]);

export const languageMedium = pgTable("language_medium", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("language_medium_name_unique").on(table.name),
	unique("language_medium_sequence_unique").on(table.sequence),
]);

export const admissionCourseApplications = pgTable("admission_course_applications", {
	id: serial().primaryKey().notNull(),
	applicationFormId: integer("application_form_id_fk").notNull(),
	admissionCourseId: integer("admission_course_id_fk").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.applicationFormId],
			foreignColumns: [applicationForms.id],
			name: "admission_course_applications_application_form_id_fk_applicatio"
		}),
	foreignKey({
			columns: [table.admissionCourseId],
			foreignColumns: [admissionCourses.id],
			name: "admission_course_applications_admission_course_id_fk_admission_"
		}),
]);

export const admissionCourses = pgTable("admission_courses", {
	id: serial().primaryKey().notNull(),
	admissionId: integer("admission_id_fk").notNull(),
	courseId: integer("course_id_fk").notNull(),
	disabled: boolean().default(false),
	isClosed: boolean("is_closed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	remarks: text(),
}, (table) => [
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [admissions.id],
			name: "admission_courses_admission_id_fk_admissions_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "admission_courses_course_id_fk_courses_id_fk"
		}),
]);

export const admissions = pgTable("admissions", {
	id: serial().primaryKey().notNull(),
	academicYearId: integer("academic_year_id_fk").notNull(),
	admissionCode: varchar("admission_code", { length: 255 }),
	isClosed: boolean("is_closed").default(false).notNull(),
	startDate: date("start_date"),
	lastDate: date("last_date"),
	archived: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	remarks: text(),
}, (table) => [
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "admissions_academic_year_id_fk_academic_years_id_fk"
		}),
]);

export const admissionGeneralInfo = pgTable("admission_general_info", {
	id: serial().primaryKey().notNull(),
	applicationFormId: integer("application_form_id_fk").notNull(),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	middleName: varchar("middle_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	dateOfBirth: date("date_of_birth").notNull(),
	nationalityId: integer("nationality_id_fk"),
	otherNationality: varchar("other_nationality", { length: 255 }),
	isGujarati: boolean("is_gujarati").default(false),
	categoryId: integer("category_id_fk"),
	religionId: integer("religion_id_fk"),
	gender: genderType().default('MALE'),
	degreeLevel: degreeLevelType("degree_level").default('UNDER_GRADUATE').notNull(),
	password: varchar({ length: 255 }).notNull(),
	whatsappNumber: varchar("whatsapp_number", { length: 15 }),
	mobileNumber: varchar("mobile_number", { length: 15 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	residenceOfKolkata: boolean("residence_of_kolkata").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.applicationFormId],
			foreignColumns: [applicationForms.id],
			name: "admission_general_info_application_form_id_fk_application_forms"
		}),
	foreignKey({
			columns: [table.nationalityId],
			foreignColumns: [nationality.id],
			name: "admission_general_info_nationality_id_fk_nationality_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "admission_general_info_category_id_fk_categories_id_fk"
		}),
	foreignKey({
			columns: [table.religionId],
			foreignColumns: [religion.id],
			name: "admission_general_info_religion_id_fk_religion_id_fk"
		}),
]);

export const nationality = pgTable("nationality", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	code: integer(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("nationality_sequence_unique").on(table.sequence),
]);

export const sportsInfo = pgTable("sports_info", {
	id: serial().primaryKey().notNull(),
	additionalInfoId: integer("additional_info_id_fk").notNull(),
	sportsCategoryId: integer("sports_category_id_fk").notNull(),
	level: sportsLevel().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.additionalInfoId],
			foreignColumns: [admissionAdditionalInfo.id],
			name: "sports_info_additional_info_id_fk_admission_additional_info_id_"
		}),
	foreignKey({
			columns: [table.sportsCategoryId],
			foreignColumns: [sportsCategories.id],
			name: "sports_info_sports_category_id_fk_sports_categories_id_fk"
		}),
]);

export const sportsCategories = pgTable("sports_categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const studentAcademicSubjects = pgTable("student_academic_subjects", {
	id: serial().primaryKey().notNull(),
	admissionAcademicInfoId: integer("admission_academic_info_id_fk").notNull(),
	academicSubjectId: integer("academic_subject_id_fk").notNull(),
	fullMarks: numeric("full_marks", { precision: 10, scale:  2 }).notNull(),
	totalMarks: numeric("total_marks", { precision: 10, scale:  2 }).notNull(),
	resultStatus: boardResultStatusType("result_status").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.admissionAcademicInfoId],
			foreignColumns: [admissionAcademicInfo.id],
			name: "student_academic_subjects_admission_academic_info_id_fk_admissi"
		}),
	foreignKey({
			columns: [table.academicSubjectId],
			foreignColumns: [academicSubjects.id],
			name: "student_academic_subjects_academic_subject_id_fk_academic_subje"
		}),
]);

export const feesStructures = pgTable("fees_structures", {
	id: serial().primaryKey().notNull(),
	feesReceiptTypeId: integer("fees_receipt_type_id_fk"),
	closingDate: date("closing_date").notNull(),
	academicYearId: integer("academic_year_id_fk").notNull(),
	courseId: integer("course_id_fk").notNull(),
	classId: integer("class_id_fk").notNull(),
	shiftId: integer("shift_id_fk").notNull(),
	advanceForCourseId: integer("advance_for_course_id_fk"),
	advanceForSemester: integer("advance_for_semester"),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	onlineStartDate: date("online_start_date").notNull(),
	onlineEndDate: date("online_end_date").notNull(),
	numberOfInstalments: integer("number_of_instalments"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.feesReceiptTypeId],
			foreignColumns: [feesReceiptTypes.id],
			name: "fees_structures_fees_receipt_type_id_fk_fees_receipt_types_id_f"
		}),
	foreignKey({
			columns: [table.academicYearId],
			foreignColumns: [academicYears.id],
			name: "fees_structures_academic_year_id_fk_academic_years_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "fees_structures_course_id_fk_courses_id_fk"
		}),
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "fees_structures_class_id_fk_classes_id_fk"
		}),
	foreignKey({
			columns: [table.shiftId],
			foreignColumns: [shifts.id],
			name: "fees_structures_shift_id_fk_shifts_id_fk"
		}),
	foreignKey({
			columns: [table.advanceForCourseId],
			foreignColumns: [courses.id],
			name: "fees_structures_advance_for_course_id_fk_courses_id_fk"
		}),
]);

export const feesComponents = pgTable("fees_components", {
	id: serial().primaryKey().notNull(),
	feesStructureId: integer("fees_structure_id_fk").notNull(),
	feesHeadId: integer("fees_head_id_fk").notNull(),
	isConcessionApplicable: boolean("is_concession_applicable").default(false).notNull(),
	baseAmount: doublePrecision("base_amount").notNull(),
	sequence: integer().notNull(),
	remarks: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.feesStructureId],
			foreignColumns: [feesStructures.id],
			name: "fees_components_fees_structure_id_fk_fees_structures_id_fk"
		}),
	foreignKey({
			columns: [table.feesHeadId],
			foreignColumns: [feesHeads.id],
			name: "fees_components_fees_head_id_fk_fees_heads_id_fk"
		}),
]);

export const feesHeads = pgTable("fees_heads", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	sequence: integer().notNull(),
	remarks: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("fees_heads_sequence_unique").on(table.sequence),
]);

export const addons = pgTable("addons", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const feesReceiptTypes = pgTable("fees_receipt_types", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	chk: varchar({ length: 255 }),
	chkMisc: varchar("chk_misc", { length: 255 }),
	printChln: varchar("print_chln", { length: 255 }),
	splType: varchar("spl_type", { length: 255 }),
	addOnId: integer("add_on_id"),
	printReceipt: varchar("print_receipt", { length: 255 }),
	chkOnline: varchar("chk_online", { length: 255 }),
	chkOnSequence: varchar("chk_on_sequence", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.addOnId],
			foreignColumns: [addons.id],
			name: "fees_receipt_types_add_on_id_addons_id_fk"
		}),
]);

export const feesSlabMapping = pgTable("fees_slab_mapping", {
	id: serial().primaryKey().notNull(),
	feesStructureId: integer("fees_structure_id_fk").notNull(),
	feesSlabId: integer("fees_slab_id_fk").notNull(),
	feeConcessionRate: doublePrecision("fee_concession_rate").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.feesStructureId],
			foreignColumns: [feesStructures.id],
			name: "fees_slab_mapping_fees_structure_id_fk_fees_structures_id_fk"
		}),
	foreignKey({
			columns: [table.feesSlabId],
			foreignColumns: [feesSlab.id],
			name: "fees_slab_mapping_fees_slab_id_fk_fees_slab_id_fk"
		}),
]);

export const feesSlab = pgTable("fees_slab", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 500 }).notNull(),
	sequence: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("fees_slab_sequence_unique").on(table.sequence),
]);

export const instalments = pgTable("instalments", {
	id: serial().primaryKey().notNull(),
	feesStructureId: integer("fees_structure_id_fk").notNull(),
	instalmentNumber: integer("instalment_number").notNull(),
	baseAmount: doublePrecision("base_amount").default(0).notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	onlineStartDate: date("online_start_date"),
	onlineEndDate: date("online_end_date"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.feesStructureId],
			foreignColumns: [feesStructures.id],
			name: "instalments_fees_structure_id_fk_fees_structures_id_fk"
		}),
]);

export const studentFeesMappings = pgTable("student_fees_mappings", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk").notNull(),
	feesStructureId: integer("fees_structure_id_fk").notNull(),
	type: studentFeesMappingType().default('FULL').notNull(),
	instalmentId: integer("instalment_id_fk"),
	baseAmount: integer("base_amount").default(0).notNull(),
	lateFee: integer("late_fee").default(0).notNull(),
	totalPayable: integer("total_payable").default(0).notNull(),
	amountPaid: integer("amount_paid"),
	paymentStatus: paymentStatus("payment_status").default('PENDING').notNull(),
	paymentMode: paymentMode("payment_mode"),
	transactionRef: varchar("transaction_ref", { length: 255 }),
	transactionDate: timestamp("transaction_date", { mode: 'string' }),
	receiptNumber: varchar("receipt_number", { length: 2555 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "student_fees_mappings_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.feesStructureId],
			foreignColumns: [feesStructures.id],
			name: "student_fees_mappings_fees_structure_id_fk_fees_structures_id_f"
		}),
	foreignKey({
			columns: [table.instalmentId],
			foreignColumns: [instalments.id],
			name: "student_fees_mappings_instalment_id_fk_instalments_id_fk"
		}),
]);

export const payments = pgTable("payments", {
	id: serial().primaryKey().notNull(),
	applicationFormId: integer("application_form_id_fk").notNull(),
	orderId: varchar("order_id", { length: 100 }).notNull(),
	transactionId: varchar("transaction_id", { length: 100 }),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: paymentStatus().default('PENDING').notNull(),
	paymentMode: paymentMode("payment_mode"),
	bankTxnId: varchar("bank_txn_id", { length: 100 }),
	gatewayName: varchar("gateway_name", { length: 50 }),
	txnDate: timestamp("txn_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	remarks: text(),
}, (table) => [
	foreignKey({
			columns: [table.applicationFormId],
			foreignColumns: [applicationForms.id],
			name: "payments_application_form_id_fk_application_forms_id_fk"
		}),
]);

export const address = pgTable("address", {
	id: serial().primaryKey().notNull(),
	countryId: integer("country_id_fk"),
	stateId: integer("state_id_fk"),
	cityId: integer("city_id_fk"),
	addressLine: varchar("address_line", { length: 1000 }),
	landmark: varchar({ length: 255 }),
	localityType: localityType("locality_type"),
	phone: varchar({ length: 255 }),
	pincode: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.countryId],
			foreignColumns: [countries.id],
			name: "address_country_id_fk_countries_id_fk"
		}),
	foreignKey({
			columns: [table.stateId],
			foreignColumns: [states.id],
			name: "address_state_id_fk_states_id_fk"
		}),
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [cities.id],
			name: "address_city_id_fk_cities_id_fk"
		}),
]);

export const states = pgTable("states", {
	id: serial().primaryKey().notNull(),
	countryId: integer("country_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.countryId],
			foreignColumns: [countries.id],
			name: "states_country_id_countries_id_fk"
		}),
	unique("states_name_unique").on(table.name),
	unique("states_sequence_unique").on(table.sequence),
]);

export const cities = pgTable("cities", {
	id: serial().primaryKey().notNull(),
	stateId: integer("state_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	documentRequired: boolean("document_required").default(false).notNull(),
	code: varchar({ length: 10 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.stateId],
			foreignColumns: [states.id],
			name: "cities_state_id_states_id_fk"
		}),
	unique("cities_name_unique").on(table.name),
	unique("cities_code_unique").on(table.code),
	unique("cities_sequence_unique").on(table.sequence),
]);

export const countries = pgTable("countries", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("countries_name_unique").on(table.name),
	unique("countries_sequence_unique").on(table.sequence),
]);

export const academicHistory = pgTable("academic_history", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk").notNull(),
	lastInstitutionId: integer("last_institution_id_fk"),
	lastBoardUniversityId: integer("last_board_university_id_fk"),
	studiedUpToClass: integer("studied_up_to_class"),
	passedYear: integer("passed_year"),
	specializationId: integer("specialization_id"),
	lastResultId: integer("last_result_id_fk"),
	remarks: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "academic_history_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.lastInstitutionId],
			foreignColumns: [institutions.id],
			name: "academic_history_last_institution_id_fk_institutions_id_fk"
		}),
	foreignKey({
			columns: [table.lastBoardUniversityId],
			foreignColumns: [boardUniversities.id],
			name: "academic_history_last_board_university_id_fk_board_universities"
		}),
	foreignKey({
			columns: [table.specializationId],
			foreignColumns: [specializations.id],
			name: "academic_history_specialization_id_specializations_id_fk"
		}),
	foreignKey({
			columns: [table.lastResultId],
			foreignColumns: [boardResultStatus.id],
			name: "academic_history_last_result_id_fk_board_result_status_id_fk"
		}),
]);

export const boardResultStatus = pgTable("board_result_status", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	spclType: varchar("spcl_type", { length: 255 }).notNull(),
	result: boardResultType(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("board_result_status_sequence_unique").on(table.sequence),
]);

export const academicIdentifiers = pgTable("academic_identifiers", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk").notNull(),
	rfid: varchar({ length: 255 }),
	framework: frameworkType(),
	courseId: integer("course_id_fk"),
	shiftId: integer("shift_id_fk"),
	cuFormNumber: varchar("cu_form_number", { length: 255 }),
	uid: varchar({ length: 255 }),
	oldUid: varchar("old_uid", { length: 255 }),
	registrationNumber: varchar("registration_number", { length: 255 }),
	rollNumber: varchar("roll_number", { length: 255 }),
	sectionId: integer("section_id_fk"),
	classRollNumber: varchar("class_roll_number", { length: 255 }),
	apaarId: varchar("apaar_id", { length: 255 }),
	abcId: varchar("abc_id", { length: 255 }),
	apprid: varchar({ length: 255 }),
	checkRepeat: boolean("check_repeat"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "academic_identifiers_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "academic_identifiers_course_id_fk_courses_id_fk"
		}),
	foreignKey({
			columns: [table.shiftId],
			foreignColumns: [shifts.id],
			name: "academic_identifiers_shift_id_fk_shifts_id_fk"
		}),
	foreignKey({
			columns: [table.sectionId],
			foreignColumns: [sections.id],
			name: "academic_identifiers_section_id_fk_sections_id_fk"
		}),
	unique("academic_identifiers_student_id_fk_unique").on(table.studentId),
]);

export const accommodation = pgTable("accommodation", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk"),
	placeOfStay: placeOfStayType("place_of_stay"),
	addressId: integer("address_id_fk"),
	startDate: date("start_date"),
	endDate: date("end_date"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "accommodation_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.addressId],
			foreignColumns: [address.id],
			name: "accommodation_address_id_fk_address_id_fk"
		}),
	unique("accommodation_student_id_fk_unique").on(table.studentId),
]);

export const emergencyContacts = pgTable("emergency_contacts", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk"),
	personName: varchar("person_name", { length: 255 }),
	relationToStudent: varchar("relation_to_student", { length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 255 }),
	officePhone: varchar("office_phone", { length: 255 }),
	residentialPhone: varchar("residential_phone", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "emergency_contacts_student_id_fk_students_id_fk"
		}),
]);

export const familyDetails = pgTable("family_details", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk").notNull(),
	parentType: parentType("parent_type"),
	fatherDetailsPersonId: integer("father_details_person_id_fk"),
	motherDetailsPersonId: integer("mother_details_person_id_fk"),
	guardianDetailsPersonId: integer("guardian_details_person_id_fk"),
	annualIncomeId: integer("annual_income_id_fk"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "family_details_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.fatherDetailsPersonId],
			foreignColumns: [person.id],
			name: "family_details_father_details_person_id_fk_person_id_fk"
		}),
	foreignKey({
			columns: [table.motherDetailsPersonId],
			foreignColumns: [person.id],
			name: "family_details_mother_details_person_id_fk_person_id_fk"
		}),
	foreignKey({
			columns: [table.guardianDetailsPersonId],
			foreignColumns: [person.id],
			name: "family_details_guardian_details_person_id_fk_person_id_fk"
		}),
	foreignKey({
			columns: [table.annualIncomeId],
			foreignColumns: [annualIncomes.id],
			name: "family_details_annual_income_id_fk_annual_incomes_id_fk"
		}),
	unique("family_details_student_id_fk_unique").on(table.studentId),
]);

export const person = pgTable("person", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 255 }),
	aadhaarCardNumber: varchar("aadhaar_card_number", { length: 255 }),
	image: varchar({ length: 255 }),
	qualificationId: integer("qualification_id_fk"),
	occupationId: integer("occupation_id_fk"),
	officeAddresId: integer("office_addres_id_fk"),
	officePhone: varchar("office_phone", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.qualificationId],
			foreignColumns: [qualifications.id],
			name: "person_qualification_id_fk_qualifications_id_fk"
		}),
	foreignKey({
			columns: [table.occupationId],
			foreignColumns: [occupations.id],
			name: "person_occupation_id_fk_occupations_id_fk"
		}),
	foreignKey({
			columns: [table.officeAddresId],
			foreignColumns: [address.id],
			name: "person_office_addres_id_fk_address_id_fk"
		}),
]);

export const health = pgTable("health", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk"),
	bloodGroupId: integer("blood_group_id_fk"),
	eyePowerLeft: numeric("eye_power_left"),
	eyePowerRight: numeric("eye_power_right"),
	height: numeric(),
	width: numeric(),
	pastMedicalHistory: text("past_medical_history"),
	pastSurgicalHistory: text("past_surgical_history"),
	drugAllergy: text("drug_allergy"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "health_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.bloodGroupId],
			foreignColumns: [bloodGroup.id],
			name: "health_blood_group_id_fk_blood_group_id_fk"
		}),
	unique("health_student_id_fk_unique").on(table.studentId),
]);

export const qualifications = pgTable("qualifications", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("qualifications_name_unique").on(table.name),
	unique("qualifications_sequence_unique").on(table.sequence),
]);

export const occupations = pgTable("occupations", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	sequence: integer(),
	disabled: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("occupations_name_unique").on(table.name),
	unique("occupations_sequence_unique").on(table.sequence),
]);

export const personalDetails = pgTable("personal_details", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk").notNull(),
	nationalityId: integer("nationality_id_fk"),
	otherNationalityId: integer("other_nationality_id_fk"),
	aadhaarCardNumber: varchar("aadhaar_card_number", { length: 16 }),
	religionId: integer("religion_id_fk"),
	categoryId: integer("category_id_fk"),
	motherTongueLanguageMediumId: integer("mother_tongue_language_medium_id_fk"),
	dateOfBirth: date("date_of_birth"),
	gender: genderType(),
	email: varchar({ length: 255 }),
	alternativeEmail: varchar("alternative_email", { length: 255 }),
	mailingAddressId: integer("mailing_address_id_fk"),
	residentialAddressId: integer("residential_address_id_fk"),
	disability: disabilityType(),
	disablityCodeId: integer("disablity_code_id_fk"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "personal_details_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.nationalityId],
			foreignColumns: [nationality.id],
			name: "personal_details_nationality_id_fk_nationality_id_fk"
		}),
	foreignKey({
			columns: [table.otherNationalityId],
			foreignColumns: [nationality.id],
			name: "personal_details_other_nationality_id_fk_nationality_id_fk"
		}),
	foreignKey({
			columns: [table.religionId],
			foreignColumns: [religion.id],
			name: "personal_details_religion_id_fk_religion_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "personal_details_category_id_fk_categories_id_fk"
		}),
	foreignKey({
			columns: [table.motherTongueLanguageMediumId],
			foreignColumns: [languageMedium.id],
			name: "personal_details_mother_tongue_language_medium_id_fk_language_m"
		}),
	foreignKey({
			columns: [table.mailingAddressId],
			foreignColumns: [address.id],
			name: "personal_details_mailing_address_id_fk_address_id_fk"
		}),
	foreignKey({
			columns: [table.residentialAddressId],
			foreignColumns: [address.id],
			name: "personal_details_residential_address_id_fk_address_id_fk"
		}),
	foreignKey({
			columns: [table.disablityCodeId],
			foreignColumns: [disabilityCodes.id],
			name: "personal_details_disablity_code_id_fk_disability_codes_id_fk"
		}),
]);

export const disabilityCodes = pgTable("disability_codes", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("disability_codes_code_unique").on(table.code),
]);

export const transportDetails = pgTable("transport_details", {
	id: serial().primaryKey().notNull(),
	studentId: integer("student_id_fk"),
	transportId: integer("transport_id_fk"),
	pickupPointId: integer("pickup_point_id_fk"),
	seatNumber: varchar("seat_number", { length: 255 }),
	pickupTime: time("pickup_time"),
	dropOffTime: time("drop_off_time"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "transport_details_student_id_fk_students_id_fk"
		}),
	foreignKey({
			columns: [table.transportId],
			foreignColumns: [transport.id],
			name: "transport_details_transport_id_fk_transport_id_fk"
		}),
	foreignKey({
			columns: [table.pickupPointId],
			foreignColumns: [pickupPoint.id],
			name: "transport_details_pickup_point_id_fk_pickup_point_id_fk"
		}),
]);

export const transport = pgTable("transport", {
	id: serial().primaryKey().notNull(),
	routeName: varchar("route_name", { length: 255 }),
	mode: transportType().default('OTHER').notNull(),
	vehicleNumber: varchar("vehicle_number", { length: 255 }),
	driverName: varchar("driver_name", { length: 255 }),
	providerDetails: varchar("provider_details", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const pickupPoint = pgTable("pickup_point", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});






import { createInsertSchema } from "drizzle-zod";
// import {
//   documents,
//   admissionCourses,
//   occupations,
//   address,
//   applicationForms,
//   academicSubjects,
//   payments,
//   studentAcademicSubjects,
//   admissionCourseApplications,
//   admissionGeneralInfo,
//   admissionAdditionalInfo,
//   admissions,
//   annualIncomes,
//   bloodGroup,
//   categories,
//   degree,
//   nationality,
//   religion,
//   sportsInfo,
//   admissionAcademicInfo,
//   boardUniversities,
//   cities,
//   countries,
//   institutions,
//   languageMedium,
//   sportsCategories,
//   states,
//   courses,
//   departments,
//   apps,
//   sessions,
//   academicYears,
//   batches,
//   classes,
//   sections,
//   shifts,
//   batchPapers,
//   subjectMetadatas,
//   students,
//   marksheets,
//   users,
//   offeredSubjects,
//   papers,
//   studentPapers,
//   studyMaterials,
//   subjects,
//   specializations,
//   subjectTypes,
//   addons,
//   feesReceiptTypes,
//   feesStructures,
//   person,
//   health,
//   qualifications,
//   personalDetails,
//   disabilityCodes,
//   transportDetails,
//   transport,
//   pickupPoint,
//   studentFeesMappings,
//   instalments,
//   familyDetails,
//   emergencyContacts,
//   accommodation,
//   academicIdentifiers,
//   academicHistory,
//   boardResultStatus,
//   feesComponents,
//   feesHeads,
//   feesSlabMapping,
//   feesSlab
// } from './schema';
import { z } from "zod";

export const createDocumentSchema = createInsertSchema(documents);
export type Document = z.infer<typeof createDocumentSchema>;

export const createAdmissionCourseSchema = createInsertSchema(admissionCourses);
export type AdmissionCourse = z.infer<typeof createAdmissionCourseSchema>;

export const createOccupationSchema = createInsertSchema(occupations);
export type Occupation = z.infer<typeof createOccupationSchema>;

export const createAddressSchema = createInsertSchema(address);
export type Address = z.infer<typeof createAddressSchema>;

export const createApplicationFormSchema = createInsertSchema(applicationForms);
export type ApplicationForm = z.infer<typeof createApplicationFormSchema>;

export const createAcademicSubjectSchema = createInsertSchema(academicSubjects);
export type AcademicSubject = z.infer<typeof createAcademicSubjectSchema>;

export const createPaymentSchema = createInsertSchema(payments);
export type Payment = z.infer<typeof createPaymentSchema>;

export const createStudentAcademicSubjectSchema = createInsertSchema(studentAcademicSubjects);
export type StudentAcademicSubject = z.infer<typeof createStudentAcademicSubjectSchema>;

export const createAdmissionCourseApplicationSchema = createInsertSchema(admissionCourseApplications);
export type AdmissionCourseApplication = z.infer<typeof createAdmissionCourseApplicationSchema>;

export const createAdmissionGeneralInfoSchema = createInsertSchema(admissionGeneralInfo);
export type AdmissionGeneralInfo = z.infer<typeof createAdmissionGeneralInfoSchema>;

export const createAdmissionAdditionalInfoSchema = createInsertSchema(admissionAdditionalInfo);
export type AdmissionAdditionalInfo = z.infer<typeof createAdmissionAdditionalInfoSchema>;

export const createAdmissionSchema = createInsertSchema(admissions);
export type Admission = z.infer<typeof createAdmissionSchema>;

export const createAnnualIncomeSchema = createInsertSchema(annualIncomes);
export type AnnualIncome = z.infer<typeof createAnnualIncomeSchema>;

export const createBloodGroupSchema = createInsertSchema(bloodGroup);
export type BloodGroup = z.infer<typeof createBloodGroupSchema>;

export const createCategorySchema = createInsertSchema(categories);
export type Category = z.infer<typeof createCategorySchema>;

export const createDegreeSchema = createInsertSchema(degree);
export type Degree = z.infer<typeof createDegreeSchema>;

export const createNationalitySchema = createInsertSchema(nationality);
export type Nationality = z.infer<typeof createNationalitySchema>;

export const createReligionSchema = createInsertSchema(religion);
export type Religion = z.infer<typeof createReligionSchema>;

export const createSportsInfoSchema = createInsertSchema(sportsInfo);
export type SportsInfo = z.infer<typeof createSportsInfoSchema>;

export const createAdmissionAcademicInfoSchema = createInsertSchema(admissionAcademicInfo);
export type AdmissionAcademicInfo = z.infer<typeof createAdmissionAcademicInfoSchema>;

export const createBoardUniversitySchema = createInsertSchema(boardUniversities);
export type BoardUniversity = z.infer<typeof createBoardUniversitySchema>;

export const createCitySchema = createInsertSchema(cities);
export type City = z.infer<typeof createCitySchema>;

export const createCountrySchema = createInsertSchema(countries);
export type Country = z.infer<typeof createCountrySchema>;

export const createInstitutionSchema = createInsertSchema(institutions);
export type Institution = z.infer<typeof createInstitutionSchema>;

export const createLanguageMediumSchema = createInsertSchema(languageMedium);
export type LanguageMedium = z.infer<typeof createLanguageMediumSchema>;

export const createSportsCategorySchema = createInsertSchema(sportsCategories);
export type SportsCategory = z.infer<typeof createSportsCategorySchema>;

export const createStateSchema = createInsertSchema(states);
export type State = z.infer<typeof createStateSchema>;

export const createCourseSchema = createInsertSchema(courses);
export type Course = z.infer<typeof createCourseSchema>;

export const createDepartmentSchema = createInsertSchema(departments)
export type Department = z.infer<typeof createDepartmentSchema>;

export const createAppSchema = createInsertSchema(apps);
export type App = z.infer<typeof createAppSchema>;

export const createSessionSchema = createInsertSchema(sessions);
export type Session = z.infer<typeof createSessionSchema>;

export const createAcademicYearSchema = createInsertSchema(academicYears);
export type AcademicYear = z.infer<typeof createAcademicYearSchema>;

export const createBatchSchema = createInsertSchema(batches);
export type Batch = z.infer<typeof createBatchSchema>;

export const createClassSchema = createInsertSchema(classes);
export type Class = z.infer<typeof createClassSchema>;

export const createSectionSchema = createInsertSchema(sections);
export type Section = z.infer<typeof createSectionSchema>;

export const createShiftSchema = createInsertSchema(shifts);
export type Shift = z.infer<typeof createShiftSchema>;

export const createBatchPaperSchema = createInsertSchema(batchPapers);
export type BatchPaper = z.infer<typeof createBatchPaperSchema>;

export const createSubjectMetadataSchema = createInsertSchema(subjectMetadatas);
export type SubjectMetadata = z.infer<typeof createSubjectMetadataSchema>;

export const createStudentSchema = createInsertSchema(students);
export type Student = z.infer<typeof createStudentSchema>;

export const createMarksheetSchema = createInsertSchema(marksheets);
export type Marksheet = z.infer<typeof createMarksheetSchema>;

export const createUserSchema = createInsertSchema(users);
export type User = z.infer<typeof createUserSchema>;

export const createOfferedSubjectSchema = createInsertSchema(offeredSubjects);
export type OfferedSubject = z.infer<typeof createOfferedSubjectSchema>;

export const createPaperSchema = createInsertSchema(papers);
export type Paper = z.infer<typeof createPaperSchema>;

export const createStudentPaperSchema = createInsertSchema(studentPapers);
export type StudentPaper = z.infer<typeof createStudentPaperSchema>;

export const createStudyMaterialSchema = createInsertSchema(studyMaterials);
export type StudyMaterial = z.infer<typeof createStudyMaterialSchema>;

export const createSubjectSchema = createInsertSchema(subjects);
export type Subject = z.infer<typeof createSubjectSchema>;

export const createSpecializationSchema = createInsertSchema(specializations);
export type Specialization = z.infer<typeof createSpecializationSchema>;

export const createSubjectTypeSchema = createInsertSchema(subjectTypes);
export type SubjectType = z.infer<typeof createSubjectTypeSchema>;

export const createAddonSchema = createInsertSchema(addons);
export type Addon = z.infer<typeof createAddonSchema>;

export const createFeesReceiptTypeSchema = createInsertSchema(feesReceiptTypes);
export type FeesReceiptType = z.infer<typeof createFeesReceiptTypeSchema>;

export const createFeesStructureSchema = createInsertSchema(feesStructures);
export type FeesStructure = z.infer<typeof createFeesStructureSchema>;

export const createPersonSchema = createInsertSchema(person);
export type Person = z.infer<typeof createPersonSchema>;

export const createHealthSchema = createInsertSchema(health);
export type Health = z.infer<typeof createHealthSchema>;

export const createQualificationSchema = createInsertSchema(qualifications);
export type Qualification = z.infer<typeof createQualificationSchema>;

export const createPersonalDetailSchema = createInsertSchema(personalDetails);
export type PersonalDetail = z.infer<typeof createPersonalDetailSchema>;

export const createDisabilityCodeSchema = createInsertSchema(disabilityCodes);
export type DisabilityCode = z.infer<typeof createDisabilityCodeSchema>;

export const createTransportDetailSchema = createInsertSchema(transportDetails);
export type TransportDetail = z.infer<typeof createTransportDetailSchema>;

export const createTransportSchema = createInsertSchema(transport);
export type Transport = z.infer<typeof createTransportSchema>;

export const createPickupPointSchema = createInsertSchema(pickupPoint);
export type PickupPoint = z.infer<typeof createPickupPointSchema>;

export const createStudentFeesMappingSchema = createInsertSchema(studentFeesMappings);
export type StudentFeesMapping = z.infer<typeof createStudentFeesMappingSchema>;

export const createInstalmentSchema = createInsertSchema(instalments);
export type Instalment = z.infer<typeof createInstalmentSchema>;

export const createFamilyDetailSchema = createInsertSchema(familyDetails);
export type FamilyDetail = z.infer<typeof createFamilyDetailSchema>;

export const createEmergencyContactSchema = createInsertSchema(emergencyContacts);
export type EmergencyContact = z.infer<typeof createEmergencyContactSchema>;

export const createAccommodationSchema = createInsertSchema(accommodation);
export type Accommodation = z.infer<typeof createAccommodationSchema>;

export const createAcademicIdentifierSchema = createInsertSchema(academicIdentifiers);
export type AcademicIdentifier = z.infer<typeof createAcademicIdentifierSchema>;

export const createAcademicHistorySchema = createInsertSchema(academicHistory);
export type AcademicHistory = z.infer<typeof createAcademicHistorySchema>;

export const createBoardResultStatusSchema = createInsertSchema(boardResultStatus);
export type BoardResultStatus = z.infer<typeof createBoardResultStatusSchema>;

export const createFeesComponentSchema = createInsertSchema(feesComponents);
export type FeesComponent = z.infer<typeof createFeesComponentSchema>;

export const createFeesHeadSchema = createInsertSchema(feesHeads);
export type FeesHead = z.infer<typeof createFeesHeadSchema>;

export const createFeesSlabMappingSchema = createInsertSchema(feesSlabMapping);
export type FeesSlabMapping = z.infer<typeof createFeesSlabMappingSchema>;

export const createFeesSlabSchema = createInsertSchema(feesSlab);
export type FeesSlab = z.infer<typeof createFeesSlabSchema>;
