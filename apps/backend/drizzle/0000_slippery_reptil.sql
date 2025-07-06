CREATE TYPE "public"."subject_status" AS ENUM('PASS', 'FAIL', 'AB', 'P', 'F', 'F(IN)', 'F(PR)', 'F(TH)');--> statement-breakpoint
CREATE TYPE "public"."board_result_type" AS ENUM('FAIL', 'PASS');--> statement-breakpoint
CREATE TYPE "public"."transport_type" AS ENUM('BUS', 'TRAIN', 'METRO', 'AUTO', 'TAXI', 'CYCLE', 'WALKING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."admission_form_status" AS ENUM('DRAFT', 'PAYMENT_DUE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'WAITING_FOR_APPROVAL', 'WAITING_FOR_PAYMENT', 'WAITING_FOR_DOCUMENTS', 'DOCUMENTS_VERIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_REJECTED');--> statement-breakpoint
CREATE TYPE "public"."admission_steps" AS ENUM('GENERAL_INFORMATION', 'ACADEMIC_INFORMATION', 'COURSE_APPLICATION', 'ADDITIONAL_INFORMATION', 'DOCUMENTS', 'PAYMENT', 'REVIEW', 'SUBMITTED');--> statement-breakpoint
CREATE TYPE "public"."board_result_status_type" AS ENUM('PASS', 'FAIL IN THEORY', 'FAIL IN PRACTICAL', 'FAIL');--> statement-breakpoint
CREATE TYPE "public"."class_type" AS ENUM('YEAR', 'SEMESTER');--> statement-breakpoint
CREATE TYPE "public"."community_type" AS ENUM('GUJARATI', 'NON-GUJARATI');--> statement-breakpoint
CREATE TYPE "public"."degree_level_type" AS ENUM('SECONDARY', 'HIGHER_SECONDARY', 'UNDER_GRADUATE', 'POST_GRADUATE');--> statement-breakpoint
CREATE TYPE "public"."disability_type" AS ENUM('VISUAL', 'HEARING_IMPAIRMENT', 'VISUAL_IMPAIRMENT', 'ORTHOPEDIC', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."framework_type" AS ENUM('CCF', 'CBCS');--> statement-breakpoint
CREATE TYPE "public"."gender_type" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."locality_type" AS ENUM('RURAL', 'URBAN');--> statement-breakpoint
CREATE TYPE "public"."marksheet_source" AS ENUM('FILE_UPLOAD', 'ADDED');--> statement-breakpoint
CREATE TYPE "public"."otp_type" AS ENUM('FOR_PHONE', 'FOR_EMAIL');--> statement-breakpoint
CREATE TYPE "public"."paper_mode_type" AS ENUM('THEORETICAL', 'PRACTICAL', 'VIVA', 'ASSIGNMENT', 'PROJECT', 'MCQ');--> statement-breakpoint
CREATE TYPE "public"."parent_type" AS ENUM('BOTH', 'FATHER_ONLY', 'MOTHER_ONLY');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('CASH', 'CHEQUE', 'ONLINE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."person_title_type" AS ENUM('MR', 'MRS', 'MS', 'DR', 'PROF', 'REV', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."place_of_stay_type" AS ENUM('OWN', 'HOSTEL', 'FAMILY_FRIENDS', 'PAYING_GUEST', 'RELATIVES');--> statement-breakpoint
CREATE TYPE "public"."programme_type" AS ENUM('HONOURS', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."sports_level" AS ENUM('NATIONAL', 'STATE', 'DISTRICT', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."stream_type" AS ENUM('SCIENCE', 'COMMERCE', 'HUMANITIES', 'ARTS');--> statement-breakpoint
CREATE TYPE "public"."student_fees_mapping_type" AS ENUM('FULL', 'INSTALMENT');--> statement-breakpoint
CREATE TYPE "public"."study_material_availability_type" AS ENUM('ALWAYS', 'CURRENT_SESSION_ONLY', 'COURSE_LEVEL', 'BATCH_LEVEL');--> statement-breakpoint
CREATE TYPE "public"."study_material_type" AS ENUM('FILE', 'LINK');--> statement-breakpoint
CREATE TYPE "public"."study_meta_type" AS ENUM('RESOURCE', 'WORKSHEET', 'ASSIGNMENT', 'PROJECT');--> statement-breakpoint
CREATE TYPE "public"."subject_category_type" AS ENUM('SPECIAL', 'COMMON', 'HONOURS', 'GENERAL', 'ELECTIVE');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('ADMIN', 'STUDENT', 'TEACHER');--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" varchar(4) NOT NULL,
	"is_current_year" boolean DEFAULT false NOT NULL,
	"session_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"section_id_fk" integer,
	"shift_id_fk" integer,
	"session_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id_fk" integer NOT NULL,
	"subject_metadata_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"type" "class_type" NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classes_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"degree_id_fk" integer,
	"name" varchar(500) NOT NULL,
	"programme_type" "programme_type",
	"short_name" varchar(500),
	"code_prefix" varchar(10),
	"university_code" varchar(10),
	"amount" integer,
	"number_of_semesters" integer,
	"duration" varchar(255),
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_name_unique" UNIQUE("name"),
	CONSTRAINT "documents_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "marksheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"year" integer NOT NULL,
	"sgpa" numeric,
	"cgpa" numeric,
	"classification" varchar(255),
	"remarks" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"source" "marksheet_source",
	"file" varchar(700),
	"created_by_user_id" integer NOT NULL,
	"updated_by_user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offered_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_metadata_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"offered_subject_id" integer NOT NULL,
	"name" varchar(500),
	"short_name" varchar(500),
	"mode" "paper_mode_type",
	"display_name" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sections_name_unique" UNIQUE("name"),
	CONSTRAINT "sections_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"from" date NOT NULL,
	"to" date NOT NULL,
	"is_current_session" boolean DEFAULT false NOT NULL,
	"code_prefix" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"code_prefix" varchar(10) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shifts_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "student_papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"batch_paper_id_fk" integer NOT NULL,
	"batch_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"availability" "study_material_availability_type" NOT NULL,
	"subject_metadata_id_fk" integer NOT NULL,
	"session_di_fk" integer,
	"course_id_fk" integer,
	"batch_id_fk" integer,
	"type" "study_material_type" NOT NULL,
	"variant" "study_meta_type" NOT NULL,
	"name" varchar(700) NOT NULL,
	"url" varchar(2000) NOT NULL,
	"file_path" varchar(700),
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"marksheet_id_fk" integer,
	"subject_metadata_id_fk" integer,
	"year1" integer NOT NULL,
	"year2" integer,
	"internal_marks" integer,
	"internal_year" integer,
	"internal_credit" integer,
	"practical_marks" integer,
	"practical_year" integer,
	"practical_credit" integer,
	"theory_marks" integer,
	"theory_year" integer,
	"theory_credit" integer,
	"total_marks" integer,
	"vival_marks" integer,
	"vival_year" integer,
	"vival_credit" integer,
	"project_marks" integer,
	"project_year" integer,
	"project_credit" integer,
	"total_credits" integer,
	"status" "subject_status",
	"ngp" numeric,
	"tgp" numeric,
	"letter_grade" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_metadatas" (
	"id" serial PRIMARY KEY NOT NULL,
	"degree_id_fk" integer NOT NULL,
	"programme_type" "programme_type" DEFAULT 'HONOURS' NOT NULL,
	"framework" "framework_type" DEFAULT 'CCF' NOT NULL,
	"class_id_fk" integer NOT NULL,
	"specialization_id_fk" integer,
	"category" "subject_category_type",
	"subject_type_id_fk" integer,
	"irp_name" varchar(500),
	"name" varchar(500),
	"irp_code" varchar(255),
	"marksheet_code" varchar(255) NOT NULL,
	"is_optional" boolean DEFAULT false,
	"credit" integer,
	"theory_credit" integer,
	"full_marks_theory" integer,
	"practical_credit" integer,
	"full_marks_practical" integer,
	"internal_credit" integer,
	"full_marks_internal" integer,
	"project_credit" integer,
	"full_marks_project" integer,
	"vival_credit" integer,
	"full_marks_viva" integer,
	"full_marks" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"irp_name" varchar(500),
	"irp_short_name" varchar(500),
	"marksheet_name" varchar(500),
	"marksheet_short_name" varchar(500),
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_types_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "academic_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_university_id_fk" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"passing_marks" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admission_additional_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_form_id_fk" integer NOT NULL,
	"alternate_mobile_number" varchar(255),
	"blood_group_id_fk" integer NOT NULL,
	"religion_id_fk" integer NOT NULL,
	"category_id_fk" integer NOT NULL,
	"is_physically_challenged" boolean DEFAULT false,
	"disability_type" "disability_type",
	"is_single_parent" boolean DEFAULT false,
	"father_title" "person_title_type",
	"father_name" varchar(255),
	"mother_title" "person_title_type",
	"mother_name" varchar(255),
	"is_either_parent_staff" boolean DEFAULT false,
	"name_of_staff_parent" varchar(255),
	"department_of_staff_parent_fk" integer,
	"has_smartphone" boolean DEFAULT false,
	"has_laptop_or_desktop" boolean DEFAULT false,
	"has_internet_access" boolean DEFAULT false,
	"annual_income_id_fk" integer NOT NULL,
	"apply_under_ncc_category" boolean DEFAULT false,
	"apply_under_sports_category" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admission_academic_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_form_id_fk" integer NOT NULL,
	"board_university_id_fk" integer NOT NULL,
	"board_result_status" "board_result_status_type" NOT NULL,
	"roll_number" varchar(255),
	"school_number" varchar(255),
	"center_number" varchar(255),
	"admit_card_id" varchar(255),
	"institute_id_fk" integer NOT NULL,
	"other_institute" varchar(500),
	"language_medium_id_fk" integer NOT NULL,
	"year_of_passing" integer NOT NULL,
	"stream_type" "stream_type" NOT NULL,
	"is_registered_for_ug_in_cu" boolean DEFAULT false,
	"cu_registration_number" varchar(255),
	"previously_registered_course_id_fk" integer,
	"other_previously_registered_course" varchar(500),
	"previous_college_id_fk" integer,
	"other_college" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admission_course_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_form_id_fk" integer NOT NULL,
	"admission_course_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admission_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_id_fk" integer NOT NULL,
	"course_id_fk" integer NOT NULL,
	"disabled" boolean DEFAULT false,
	"is_closed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "admission_general_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_form_id_fk" integer NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"middle_name" varchar(255),
	"last_name" varchar(255),
	"date_of_birth" date NOT NULL,
	"nationality_id_fk" integer,
	"other_nationality" varchar(255),
	"is_gujarati" boolean DEFAULT false,
	"category_id_fk" integer,
	"religion_id_fk" integer,
	"gender" "gender_type" DEFAULT 'MALE',
	"degree_level" "degree_level_type" DEFAULT 'UNDER_GRADUATE' NOT NULL,
	"password" varchar(255) NOT NULL,
	"whatsapp_number" varchar(15),
	"mobile_number" varchar(15) NOT NULL,
	"email" varchar(255) NOT NULL,
	"residence_of_kolkata" boolean NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"admission_code" varchar(255),
	"is_closed" boolean DEFAULT false NOT NULL,
	"start_date" date,
	"last_date" date,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "application_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_id_fk" integer NOT NULL,
	"application_number" varchar(255),
	"form_status" "admission_form_status" NOT NULL,
	"admission_step" "admission_steps" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "sports_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sports_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"additional_info_id_fk" integer NOT NULL,
	"sports_category_id_fk" integer NOT NULL,
	"level" "sports_level" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_academic_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_academic_info_id_fk" integer NOT NULL,
	"academic_subject_id_fk" integer NOT NULL,
	"full_marks" numeric(10, 2) NOT NULL,
	"total_marks" numeric(10, 2) NOT NULL,
	"result_status" "board_result_status_type" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(700) NOT NULL,
	"description" varchar(1000),
	"icon" varchar(500),
	"url" varchar(1000) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"otp" varchar(6) NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"type" "otp_type" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "addons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fees_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"fees_structure_id_fk" integer NOT NULL,
	"fees_head_id_fk" integer NOT NULL,
	"is_concession_applicable" boolean DEFAULT false NOT NULL,
	"base_amount" double precision NOT NULL,
	"sequence" integer NOT NULL,
	"remarks" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fees_heads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer NOT NULL,
	"remarks" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fees_heads_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "fees_receipt_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"chk" varchar(255),
	"chk_misc" varchar(255),
	"print_chln" varchar(255),
	"spl_type" varchar(255),
	"add_on_id" integer,
	"print_receipt" varchar(255),
	"chk_online" varchar(255),
	"chk_on_sequence" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fees_slab_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"fees_structure_id_fk" integer NOT NULL,
	"fees_slab_id_fk" integer NOT NULL,
	"fee_concession_rate" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fees_slab" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500) NOT NULL,
	"sequence" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fees_slab_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "fees_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"fees_receipt_type_id_fk" integer,
	"closing_date" date NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"shift_id_fk" integer NOT NULL,
	"advance_for_course_id_fk" integer,
	"advance_for_semester" integer,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"online_start_date" date NOT NULL,
	"online_end_date" date NOT NULL,
	"number_of_instalments" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instalments" (
	"id" serial PRIMARY KEY NOT NULL,
	"fees_structure_id_fk" integer NOT NULL,
	"instalment_number" integer NOT NULL,
	"base_amount" double precision DEFAULT 0 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"online_start_date" date NOT NULL,
	"online_end_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_fees_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"fees_structure_id_fk" integer NOT NULL,
	"type" "student_fees_mapping_type" DEFAULT 'FULL' NOT NULL,
	"instalment_id_fk" integer,
	"base_amount" integer DEFAULT 0 NOT NULL,
	"late_fee" integer DEFAULT 0 NOT NULL,
	"total_payable" integer DEFAULT 0 NOT NULL,
	"amount_paid" integer,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"payment_mode" "payment_mode",
	"transaction_ref" varchar(255),
	"transaction_date" timestamp,
	"receipt_number" varchar(2555),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_form_id_fk" integer NOT NULL,
	"order_id" varchar(100) NOT NULL,
	"transaction_id" varchar(100),
	"amount" numeric(10, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"payment_mode" "payment_mode",
	"bank_txn_id" varchar(100),
	"gateway_name" varchar(50),
	"txn_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "annual_incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"range" varchar(255) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "annual_incomes_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "blood_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(255) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blood_group_type_unique" UNIQUE("type"),
	CONSTRAINT "blood_group_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "board_result_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"spcl_type" varchar(255) NOT NULL,
	"result" "board_result_type",
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "board_result_status_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "board_universities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(700) NOT NULL,
	"degree_id" integer,
	"passing_marks" integer,
	"code" varchar(255),
	"address_id" integer,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "board_universities_name_unique" UNIQUE("name"),
	CONSTRAINT "board_universities_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"document_required" boolean,
	"code" varchar(10) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_code_unique" UNIQUE("code"),
	CONSTRAINT "categories_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"document_required" boolean DEFAULT false NOT NULL,
	"code" varchar(10) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cities_name_unique" UNIQUE("name"),
	CONSTRAINT "cities_code_unique" UNIQUE("code"),
	CONSTRAINT "cities_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name"),
	CONSTRAINT "countries_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "degree" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" "degree_level_type",
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "degree_name_unique" UNIQUE("name"),
	CONSTRAINT "degree_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(700) NOT NULL,
	"degree_id" integer NOT NULL,
	"address_id" integer,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "institutions_name_unique" UNIQUE("name"),
	CONSTRAINT "institutions_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "language_medium" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "language_medium_name_unique" UNIQUE("name"),
	CONSTRAINT "language_medium_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "nationality" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" integer,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nationality_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "occupations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "occupations_name_unique" UNIQUE("name"),
	CONSTRAINT "occupations_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "pickup_point" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qualifications_name_unique" UNIQUE("name"),
	CONSTRAINT "qualifications_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "religion" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "religion_name_unique" UNIQUE("name"),
	CONSTRAINT "religion_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "states_name_unique" UNIQUE("name"),
	CONSTRAINT "states_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "transport" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_name" varchar(255),
	"mode" "transport_type" DEFAULT 'OTHER' NOT NULL,
	"vehicle_number" varchar(255),
	"driver_name" varchar(255),
	"provider_details" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"last_institution_id_fk" integer,
	"last_board_university_id_fk" integer,
	"studied_up_to_class" integer,
	"passed_year" integer,
	"specialization_id" integer,
	"last_result_id_fk" integer,
	"remarks" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_identifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"rfid" varchar(255),
	"framework" "framework_type",
	"course_id_fk" integer,
	"shift_id_fk" integer,
	"cu_form_number" varchar(255),
	"uid" varchar(255),
	"old_uid" varchar(255),
	"registration_number" varchar(255),
	"roll_number" varchar(255),
	"section_id_fk" integer,
	"class_roll_number" varchar(255),
	"apaar_id" varchar(255),
	"abc_id" varchar(255),
	"apprid" varchar(255),
	"check_repeat" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "academic_identifiers_student_id_fk_unique" UNIQUE("student_id_fk")
);
--> statement-breakpoint
CREATE TABLE "accommodation" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer,
	"place_of_stay" "place_of_stay_type",
	"address_id_fk" integer,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accommodation_student_id_fk_unique" UNIQUE("student_id_fk")
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id_fk" integer,
	"state_id_fk" integer,
	"city_id_fk" integer,
	"address_line" varchar(1000),
	"landmark" varchar(255),
	"locality_type" "locality_type",
	"phone" varchar(255),
	"pincode" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(900) NOT NULL,
	"code" varchar(100) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "departments_name_unique" UNIQUE("name"),
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "disability_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disability_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer,
	"person_name" varchar(255),
	"relation_to_student" varchar(255),
	"email" varchar(255),
	"phone" varchar(255),
	"office_phone" varchar(255),
	"residential_phone" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"parent_type" "parent_type",
	"father_details_person_id_fk" integer,
	"mother_details_person_id_fk" integer,
	"guardian_details_person_id_fk" integer,
	"annual_income_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_details_student_id_fk_unique" UNIQUE("student_id_fk")
);
--> statement-breakpoint
CREATE TABLE "health" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer,
	"blood_group_id_fk" integer,
	"eye_power_left" numeric,
	"eye_power_right" numeric,
	"height" numeric,
	"width" numeric,
	"past_medical_history" text,
	"past_surgical_history" text,
	"drug_allergy" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "health_student_id_fk_unique" UNIQUE("student_id_fk")
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"phone" varchar(255),
	"aadhaar_card_number" varchar(255),
	"image" varchar(255),
	"qualification_id_fk" integer,
	"occupation_id_fk" integer,
	"office_addres_id_fk" integer,
	"office_phone" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"nationality_id_fk" integer,
	"other_nationality_id_fk" integer,
	"aadhaar_card_number" varchar(16),
	"religion_id_fk" integer,
	"category_id_fk" integer,
	"mother_tongue_language_medium_id_fk" integer,
	"date_of_birth" date,
	"gender" "gender_type",
	"email" varchar(255),
	"alternative_email" varchar(255),
	"mailing_address_id_fk" integer,
	"residential_address_id_fk" integer,
	"disability" "disability_type",
	"disablity_code_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specializations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "specializations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id_fk" integer NOT NULL,
	"application_id_fk" integer,
	"community" "community_type",
	"handicapped" boolean DEFAULT false,
	"specialization_id_fk" integer,
	"last_passed_year" integer,
	"notes" text,
	"active" boolean,
	"alumni" boolean,
	"is_suspended" boolean DEFAULT false,
	"leaving_date" timestamp,
	"leaving_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer,
	"transport_id_fk" integer,
	"pickup_point_id_fk" integer,
	"seat_number" varchar(255),
	"pickup_time" time,
	"drop_off_time" time,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(500) NOT NULL,
	"password" varchar(255) NOT NULL,
	"phone" varchar(255),
	"whatsapp_number" varchar(255),
	"image" varchar(255),
	"type" "user_type" DEFAULT 'STUDENT',
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_section_id_fk_sections_id_fk" FOREIGN KEY ("section_id_fk") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_papers" ADD CONSTRAINT "batch_papers_batch_id_fk_batches_id_fk" FOREIGN KEY ("batch_id_fk") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_papers" ADD CONSTRAINT "batch_papers_subject_metadata_id_fk_subject_metadatas_id_fk" FOREIGN KEY ("subject_metadata_id_fk") REFERENCES "public"."subject_metadatas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_degree_id_fk_degree_id_fk" FOREIGN KEY ("degree_id_fk") REFERENCES "public"."degree"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offered_subjects" ADD CONSTRAINT "offered_subjects_subject_metadata_id_fk_subject_metadatas_id_fk" FOREIGN KEY ("subject_metadata_id_fk") REFERENCES "public"."subject_metadatas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_offered_subject_id_offered_subjects_id_fk" FOREIGN KEY ("offered_subject_id") REFERENCES "public"."offered_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_papers" ADD CONSTRAINT "student_papers_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_papers" ADD CONSTRAINT "student_papers_batch_paper_id_fk_batch_papers_id_fk" FOREIGN KEY ("batch_paper_id_fk") REFERENCES "public"."batch_papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_papers" ADD CONSTRAINT "student_papers_batch_id_fk_batches_id_fk" FOREIGN KEY ("batch_id_fk") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_subject_metadata_id_fk_subject_metadatas_id_fk" FOREIGN KEY ("subject_metadata_id_fk") REFERENCES "public"."subject_metadatas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_session_di_fk_sessions_id_fk" FOREIGN KEY ("session_di_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_batch_id_fk_batches_id_fk" FOREIGN KEY ("batch_id_fk") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_marksheet_id_fk_marksheets_id_fk" FOREIGN KEY ("marksheet_id_fk") REFERENCES "public"."marksheets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_subject_metadata_id_fk_subject_metadatas_id_fk" FOREIGN KEY ("subject_metadata_id_fk") REFERENCES "public"."subject_metadatas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD CONSTRAINT "subject_metadatas_degree_id_fk_degree_id_fk" FOREIGN KEY ("degree_id_fk") REFERENCES "public"."degree"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD CONSTRAINT "subject_metadatas_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD CONSTRAINT "subject_metadatas_specialization_id_fk_specializations_id_fk" FOREIGN KEY ("specialization_id_fk") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD CONSTRAINT "subject_metadatas_subject_type_id_fk_subject_types_id_fk" FOREIGN KEY ("subject_type_id_fk") REFERENCES "public"."subject_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_subjects" ADD CONSTRAINT "academic_subjects_board_university_id_fk_board_universities_id_fk" FOREIGN KEY ("board_university_id_fk") REFERENCES "public"."board_universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_blood_group_id_fk_blood_group_id_fk" FOREIGN KEY ("blood_group_id_fk") REFERENCES "public"."blood_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_religion_id_fk_religion_id_fk" FOREIGN KEY ("religion_id_fk") REFERENCES "public"."religion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_category_id_fk_categories_id_fk" FOREIGN KEY ("category_id_fk") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_department_of_staff_parent_fk_departments_id_fk" FOREIGN KEY ("department_of_staff_parent_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_annual_income_id_fk_annual_incomes_id_fk" FOREIGN KEY ("annual_income_id_fk") REFERENCES "public"."annual_incomes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_board_university_id_fk_board_universities_id_fk" FOREIGN KEY ("board_university_id_fk") REFERENCES "public"."board_universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_institute_id_fk_institutions_id_fk" FOREIGN KEY ("institute_id_fk") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_language_medium_id_fk_language_medium_id_fk" FOREIGN KEY ("language_medium_id_fk") REFERENCES "public"."language_medium"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_previously_registered_course_id_fk_courses_id_fk" FOREIGN KEY ("previously_registered_course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_previous_college_id_fk_institutions_id_fk" FOREIGN KEY ("previous_college_id_fk") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_course_applications" ADD CONSTRAINT "admission_course_applications_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_course_applications" ADD CONSTRAINT "admission_course_applications_admission_course_id_fk_admission_courses_id_fk" FOREIGN KEY ("admission_course_id_fk") REFERENCES "public"."admission_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_courses" ADD CONSTRAINT "admission_courses_admission_id_fk_admissions_id_fk" FOREIGN KEY ("admission_id_fk") REFERENCES "public"."admissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_courses" ADD CONSTRAINT "admission_courses_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_nationality_id_fk_nationality_id_fk" FOREIGN KEY ("nationality_id_fk") REFERENCES "public"."nationality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_category_id_fk_categories_id_fk" FOREIGN KEY ("category_id_fk") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_religion_id_fk_religion_id_fk" FOREIGN KEY ("religion_id_fk") REFERENCES "public"."religion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_forms" ADD CONSTRAINT "application_forms_admission_id_fk_admissions_id_fk" FOREIGN KEY ("admission_id_fk") REFERENCES "public"."admissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_info" ADD CONSTRAINT "sports_info_additional_info_id_fk_admission_additional_info_id_fk" FOREIGN KEY ("additional_info_id_fk") REFERENCES "public"."admission_additional_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_info" ADD CONSTRAINT "sports_info_sports_category_id_fk_sports_categories_id_fk" FOREIGN KEY ("sports_category_id_fk") REFERENCES "public"."sports_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_academic_subjects" ADD CONSTRAINT "student_academic_subjects_admission_academic_info_id_fk_admission_academic_info_id_fk" FOREIGN KEY ("admission_academic_info_id_fk") REFERENCES "public"."admission_academic_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_academic_subjects" ADD CONSTRAINT "student_academic_subjects_academic_subject_id_fk_academic_subjects_id_fk" FOREIGN KEY ("academic_subject_id_fk") REFERENCES "public"."academic_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_components" ADD CONSTRAINT "fees_components_fees_structure_id_fk_fees_structures_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."fees_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_components" ADD CONSTRAINT "fees_components_fees_head_id_fk_fees_heads_id_fk" FOREIGN KEY ("fees_head_id_fk") REFERENCES "public"."fees_heads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_receipt_types" ADD CONSTRAINT "fees_receipt_types_add_on_id_addons_id_fk" FOREIGN KEY ("add_on_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_slab_mapping" ADD CONSTRAINT "fees_slab_mapping_fees_structure_id_fk_fees_structures_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."fees_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_slab_mapping" ADD CONSTRAINT "fees_slab_mapping_fees_slab_id_fk_fees_slab_id_fk" FOREIGN KEY ("fees_slab_id_fk") REFERENCES "public"."fees_slab"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_fees_receipt_type_id_fk_fees_receipt_types_id_fk" FOREIGN KEY ("fees_receipt_type_id_fk") REFERENCES "public"."fees_receipt_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_advance_for_course_id_fk_courses_id_fk" FOREIGN KEY ("advance_for_course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instalments" ADD CONSTRAINT "instalments_fees_structure_id_fk_fees_structures_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."fees_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ADD CONSTRAINT "student_fees_mappings_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ADD CONSTRAINT "student_fees_mappings_fees_structure_id_fk_fees_structures_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."fees_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ADD CONSTRAINT "student_fees_mappings_instalment_id_fk_instalments_id_fk" FOREIGN KEY ("instalment_id_fk") REFERENCES "public"."instalments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_universities" ADD CONSTRAINT "board_universities_degree_id_degree_id_fk" FOREIGN KEY ("degree_id") REFERENCES "public"."degree"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_universities" ADD CONSTRAINT "board_universities_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_degree_id_degree_id_fk" FOREIGN KEY ("degree_id") REFERENCES "public"."degree"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "states" ADD CONSTRAINT "states_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_last_institution_id_fk_institutions_id_fk" FOREIGN KEY ("last_institution_id_fk") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_last_board_university_id_fk_board_universities_id_fk" FOREIGN KEY ("last_board_university_id_fk") REFERENCES "public"."board_universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_specialization_id_specializations_id_fk" FOREIGN KEY ("specialization_id") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_history" ADD CONSTRAINT "academic_history_last_result_id_fk_board_result_status_id_fk" FOREIGN KEY ("last_result_id_fk") REFERENCES "public"."board_result_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_identifiers" ADD CONSTRAINT "academic_identifiers_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_identifiers" ADD CONSTRAINT "academic_identifiers_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_identifiers" ADD CONSTRAINT "academic_identifiers_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_identifiers" ADD CONSTRAINT "academic_identifiers_section_id_fk_sections_id_fk" FOREIGN KEY ("section_id_fk") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation" ADD CONSTRAINT "accommodation_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation" ADD CONSTRAINT "accommodation_address_id_fk_address_id_fk" FOREIGN KEY ("address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_country_id_fk_countries_id_fk" FOREIGN KEY ("country_id_fk") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_state_id_fk_states_id_fk" FOREIGN KEY ("state_id_fk") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_city_id_fk_cities_id_fk" FOREIGN KEY ("city_id_fk") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_father_details_person_id_fk_person_id_fk" FOREIGN KEY ("father_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_mother_details_person_id_fk_person_id_fk" FOREIGN KEY ("mother_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_guardian_details_person_id_fk_person_id_fk" FOREIGN KEY ("guardian_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_annual_income_id_fk_annual_incomes_id_fk" FOREIGN KEY ("annual_income_id_fk") REFERENCES "public"."annual_incomes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health" ADD CONSTRAINT "health_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health" ADD CONSTRAINT "health_blood_group_id_fk_blood_group_id_fk" FOREIGN KEY ("blood_group_id_fk") REFERENCES "public"."blood_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_qualification_id_fk_qualifications_id_fk" FOREIGN KEY ("qualification_id_fk") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_occupation_id_fk_occupations_id_fk" FOREIGN KEY ("occupation_id_fk") REFERENCES "public"."occupations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_office_addres_id_fk_address_id_fk" FOREIGN KEY ("office_addres_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_nationality_id_fk_nationality_id_fk" FOREIGN KEY ("nationality_id_fk") REFERENCES "public"."nationality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_other_nationality_id_fk_nationality_id_fk" FOREIGN KEY ("other_nationality_id_fk") REFERENCES "public"."nationality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_religion_id_fk_religion_id_fk" FOREIGN KEY ("religion_id_fk") REFERENCES "public"."religion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_category_id_fk_categories_id_fk" FOREIGN KEY ("category_id_fk") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_mother_tongue_language_medium_id_fk_language_medium_id_fk" FOREIGN KEY ("mother_tongue_language_medium_id_fk") REFERENCES "public"."language_medium"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_mailing_address_id_fk_address_id_fk" FOREIGN KEY ("mailing_address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_residential_address_id_fk_address_id_fk" FOREIGN KEY ("residential_address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_disablity_code_id_fk_disability_codes_id_fk" FOREIGN KEY ("disablity_code_id_fk") REFERENCES "public"."disability_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_application_id_fk_application_forms_id_fk" FOREIGN KEY ("application_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_specialization_id_fk_specializations_id_fk" FOREIGN KEY ("specialization_id_fk") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_details" ADD CONSTRAINT "transport_details_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_details" ADD CONSTRAINT "transport_details_transport_id_fk_transport_id_fk" FOREIGN KEY ("transport_id_fk") REFERENCES "public"."transport"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_details" ADD CONSTRAINT "transport_details_pickup_point_id_fk_pickup_point_id_fk" FOREIGN KEY ("pickup_point_id_fk") REFERENCES "public"."pickup_point"("id") ON DELETE no action ON UPDATE no action;