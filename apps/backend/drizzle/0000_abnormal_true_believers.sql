CREATE TYPE "public"."admission_form_status" AS ENUM('DRAFT', 'PAYMENT_DUE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'WAITING_FOR_APPROVAL', 'WAITING_FOR_PAYMENT', 'WAITING_FOR_DOCUMENTS', 'DOCUMENTS_VERIFIED', 'DOCUMENTS_PENDING', 'DOCUMENTS_REJECTED', 'MERIT_LISTED', 'WAITING_FOR_ADMISSION', 'ADMITTED', 'SUBJECT_PAPER_SELECTION');--> statement-breakpoint
CREATE TYPE "public"."admission_steps" AS ENUM('GENERAL_INFORMATION', 'ACADEMIC_INFORMATION', 'COURSE_APPLICATION', 'ADDITIONAL_INFORMATION', 'DOCUMENTS', 'PAYMENT', 'REVIEW', 'SUBMITTED', 'MINOR_PAPER_SELECTION', 'SEMESTER_WISE_SUBJECT_SELECTION');--> statement-breakpoint
CREATE TYPE "public"."attachment_type" AS ENUM('FILE', 'LINK');--> statement-breakpoint
CREATE TYPE "public"."bank_account_type" AS ENUM('SAVINGS', 'CURRENT', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."board_result_status_type" AS ENUM('PASS', 'FAIL IN THEORY', 'FAIL IN PRACTICAL', 'FAIL');--> statement-breakpoint
CREATE TYPE "public"."board_result_type" AS ENUM('FAIL', 'PASS');--> statement-breakpoint
CREATE TYPE "public"."class_type" AS ENUM('YEAR', 'SEMESTER');--> statement-breakpoint
CREATE TYPE "public"."community_type" AS ENUM('GUJARATI', 'NON-GUJARATI');--> statement-breakpoint
CREATE TYPE "public"."degree_level_type" AS ENUM('SECONDARY', 'HIGHER_SECONDARY', 'UNDER_GRADUATE', 'POST_GRADUATE', 'DOCTORATE');--> statement-breakpoint
CREATE TYPE "public"."disability_type" AS ENUM('VISUAL', 'HEARING_IMPAIRMENT', 'VISUAL_IMPAIRMENT', 'ORTHOPEDIC', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."framework_type" AS ENUM('CCF', 'CBCS');--> statement-breakpoint
CREATE TYPE "public"."gender_type" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."locality_type" AS ENUM('RURAL', 'URBAN');--> statement-breakpoint
CREATE TYPE "public"."marital_status_type" AS ENUM('SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED');--> statement-breakpoint
CREATE TYPE "public"."marksheet_source" AS ENUM('FILE_UPLOAD', 'ADDED');--> statement-breakpoint
CREATE TYPE "public"."notice_status" AS ENUM('ACTIVE', 'EXPIRED', 'SCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."notice_variant" AS ENUM('EXAM', 'ALERT', 'FEE', 'EVENT');--> statement-breakpoint
CREATE TYPE "public"."otp_type" AS ENUM('FOR_PHONE', 'FOR_EMAIL');--> statement-breakpoint
CREATE TYPE "public"."paper_mode_type" AS ENUM('THEORETICAL', 'PRACTICAL', 'VIVA', 'ASSIGNMENT', 'PROJECT', 'MCQ');--> statement-breakpoint
CREATE TYPE "public"."parent_type" AS ENUM('BOTH', 'FATHER_ONLY', 'MOTHER_ONLY');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('CASH', 'CHEQUE', 'ONLINE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."person_title_type" AS ENUM('MR', 'MRS', 'MS', 'DR', 'PROF', 'REV', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."place_of_stay_type" AS ENUM('OWN', 'HOSTEL', 'FAMILY_FRIENDS', 'PAYING_GUEST', 'RELATIVES');--> statement-breakpoint
CREATE TYPE "public"."programme_type" AS ENUM('HONOURS', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."settings_input_type" AS ENUM('NUMBER', 'TEXT', 'FILE', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."settings_variant_type" AS ENUM('GENERAL', 'API_CONFIG');--> statement-breakpoint
CREATE TYPE "public"."sports_level" AS ENUM('NATIONAL', 'STATE', 'DISTRICT', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."stream_type" AS ENUM('SCIENCE', 'COMMERCE', 'HUMANITIES', 'ARTS');--> statement-breakpoint
CREATE TYPE "public"."student_fees_mapping_type" AS ENUM('FULL', 'INSTALMENT');--> statement-breakpoint
CREATE TYPE "public"."study_material_availability_type" AS ENUM('ALWAYS', 'CURRENT_SESSION_ONLY', 'COURSE_LEVEL', 'BATCH_LEVEL');--> statement-breakpoint
CREATE TYPE "public"."study_meta_type" AS ENUM('RESOURCE', 'WORKSHEET', 'ASSIGNMENT', 'PROJECT');--> statement-breakpoint
CREATE TYPE "public"."subject_category_type" AS ENUM('SPECIAL', 'COMMON', 'HONOURS', 'GENERAL', 'ELECTIVE');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('ADMIN', 'STUDENT', 'FACULTY', 'STAFF', 'PARENTS');--> statement-breakpoint
CREATE TYPE "public"."transport_type" AS ENUM('BUS', 'TRAIN', 'METRO', 'AUTO', 'TAXI', 'CYCLE', 'WALKING', 'OTHER');--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_academic_year_id" integer,
	"year" varchar(255) NOT NULL,
	"is_current_year" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_student_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id_fk" integer NOT NULL,
	"student_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"section_id_fk" integer,
	"shift_id_fk" integer,
	"session_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(255),
	"type" "class_type" NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classes_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_name_unique" UNIQUE("name"),
	CONSTRAINT "documents_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "marksheet_paper_component_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"marksheet_paper_mapping_id_fk" integer NOT NULL,
	"paper_component_id_fk" integer NOT NULL,
	"marks_obtained" double precision DEFAULT 0,
	"credit_obtained" double precision DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marksheet_paper_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"marksheet_id_fk" integer NOT NULL,
	"batch_student_paper_id_fk" integer NOT NULL,
	"year_of_appearance_id_fk" integer,
	"total_credit_obtained" double precision DEFAULT 0,
	"total_marks_obtained" double precision DEFAULT 0,
	"tgp" double precision DEFAULT 0,
	"ngp" double precision DEFAULT 0,
	"letter_grade" varchar(10),
	"status" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"source" "marksheet_source",
	"file" varchar(700),
	"created_by_user_id" integer NOT NULL,
	"updated_by_user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notice_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"notice_id_fk" integer NOT NULL,
	"type" "attachment_type" NOT NULL,
	"url" varchar(2000),
	"file_path" varchar(700),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"title" varchar(600) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"status" "notice_status" DEFAULT 'ACTIVE' NOT NULL,
	"variant" "notice_variant" DEFAULT 'ALERT' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"for_students" boolean NOT NULL,
	"for_faculty" boolean NOT NULL,
	"for_staff" boolean NOT NULL,
	"for_admins" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sections_name_unique" UNIQUE("name"),
	CONSTRAINT "sections_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_session_id" integer,
	"academic_id_fk" integer,
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
	"legacy_shift_id" integer,
	"name" varchar(500) NOT NULL,
	"code_prefix" varchar(10) NOT NULL,
	"sequence" integer,
	"disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shifts_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "board_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_board_subject_mapping_sub_id" integer,
	"board_id_fk" integer NOT NULL,
	"subject_id_fk" integer NOT NULL,
	"full_marks_theory" double precision,
	"passing_marks_theory" double precision,
	"full_marks_practical" double precision,
	"passing_marks_practical" double precision,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admission_course_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_course_details_id" integer,
	"is_transferred" boolean DEFAULT false NOT NULL,
	"application_form_id_fk" integer NOT NULL,
	"admission_program_course_id_fk" integer NOT NULL,
	"stream_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"shift_id_fk" integer NOT NULL,
	"eligibility_criteria_id_fk" integer,
	"student_category_id_fk" integer NOT NULL,
	"rfid_number" varchar(50),
	"class_roll_number" varchar(50) NOT NULL,
	"app_number" varchar(50) NOT NULL,
	"challan_number" varchar(50) NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"payment_timestamp" timestamp,
	"received_payment" boolean DEFAULT false NOT NULL,
	"payment_type" varchar(500),
	"application_timestamp" timestamp DEFAULT now() NOT NULL,
	"is_sms_sent" boolean DEFAULT false NOT NULL,
	"sms_sent_at" timestamp,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verified_by_user_id_fk" integer,
	"verified_on" timestamp,
	"is_freeship_applied" boolean DEFAULT false NOT NULL,
	"freeship_date" timestamp,
	"freeship_approved_by_user_id_fk" integer,
	"freeship_approved_on" timestamp,
	"freeship_perc" integer NOT NULL,
	"freeship_perc_applied" integer DEFAULT 0 NOT NULL,
	"is_freeship_approved" boolean DEFAULT false NOT NULL,
	"freeship_amount_id" integer,
	"is_fees_challan_generated" boolean DEFAULT false NOT NULL,
	"fees_challan_number" varchar(50),
	"fees_challan_generated_at" timestamp,
	"is_fees_paid" boolean DEFAULT false NOT NULL,
	"fees_paid_type" varchar(500),
	"fees_paid_at" timestamp,
	"fees_payment_bank_branch_id_fk" integer,
	"is_installment_applied" boolean DEFAULT false NOT NULL,
	"installment_applied_on" timestamp,
	"fees_challan_installment_amount" integer,
	"fees_payment_entry_date" timestamp,
	"fees_paid_reconciled" boolean DEFAULT false NOT NULL,
	"online_ref_number" varchar(200),
	"payment_message" varchar(1000),
	"last_date_document_pending" timestamp,
	"adm_frm_dwnld" varchar(5),
	"adm_frm_dwnl_id_entry_date" timestamp,
	"fees_payment_bank_id" integer,
	"fees_draft_number" varchar(50),
	"fees_draft_date" timestamp,
	"fees_draft_drawn_on" timestamp,
	"fees_draft_amount" integer,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"block_remarks" varchar(1000),
	"shift_change_remarks" varchar(1000),
	"specialization_id_fk" integer,
	"is_ed_cut_off_failed" boolean DEFAULT false NOT NULL,
	"is_merit_listed" boolean DEFAULT false NOT NULL,
	"best_of_four" double precision,
	"total_score" double precision,
	"merit_list_id_fk" integer,
	"merit_listed_on" timestamp,
	"merit_list_count" integer,
	"merit_list_by_user_id_fk" integer,
	"is_admit_card_selected" boolean DEFAULT false NOT NULL,
	"admit_card_selected_on" timestamp,
	"admission_test_sms_sent_on" timestamp,
	"instltran_id" integer,
	"document_verification_called_at" timestamp,
	"installment_ref_number" varchar(100),
	"verifymastersubid" integer,
	"verify_type" varchar(100),
	"verify_remarks" varchar(500),
	"verify_master_sub_orig1_id" integer,
	"verify_master_sub_orig2_id" integer,
	"verify_type_orig1" varchar(100),
	"verify_type_orig2" varchar(100),
	"verify_remarks1" varchar(500),
	"verify_remarks2" varchar(500),
	"gujarati_periods" integer,
	"gujarati_admission_type" varchar(100),
	"gujarati_admission_date" timestamp,
	"sport_quota_admission_type" varchar(100),
	"sports_quota_admission_date" timestamp,
	"is_sports_quota_applied" boolean DEFAULT false NOT NULL,
	"subject_selection" integer,
	"document_status" varchar(1000),
	"document_upload_date" timestamp,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"cancel_source_id" integer,
	"cancel_remarks" varchar(1000),
	"cancel_date" timestamp,
	"cancel_by_user_id_fk" integer,
	"cancel_entry_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_category" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_student_category_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"document_required" boolean DEFAULT false NOT NULL,
	"course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "adm_subject_paper_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_cvsubject_selection_id" integer,
	"student_id_fk" integer NOT NULL,
	"admission_course_details_id_fk" integer NOT NULL,
	"paper_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admission_additional_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_form_id_fk" integer NOT NULL,
	"alternate_mobile_number" varchar(255),
	"is_physically_challenged" boolean DEFAULT false,
	"disability_type" "disability_type",
	"is_single_parent" boolean DEFAULT false,
	"family_details_id_fk" integer,
	"is_either_parent_staff" boolean DEFAULT false,
	"name_of_staff_parent" varchar(255),
	"department_of_staff_parent_fk" integer,
	"has_family_ex_student" boolean DEFAULT false,
	"family_ex_student_relation" varchar(255),
	"family_ex_student_name" varchar(255),
	"family_ex_student_program_course_id_fk" integer,
	"family_ex_student_year_of_passing" integer,
	"has_smartphone" boolean DEFAULT false,
	"has_laptop_or_desktop" boolean DEFAULT false,
	"has_internet_access" boolean DEFAULT false,
	"annual_income_id_fk" integer,
	"apply_under_ncc_category" boolean DEFAULT false,
	"apply_under_sports_category" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admission_academic_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_academic_info_id" integer,
	"application_form_id_fk" integer NOT NULL,
	"board_id_fk" integer NOT NULL,
	"other_board" varchar(755),
	"board_result_status" "board_result_status_type" NOT NULL,
	"percentage_of_marks" double precision,
	"division" varchar(255),
	"rank" integer,
	"total_points" double precision,
	"aggregate" double precision,
	"subject_studied" varchar(255),
	"last_school_id_fk" integer,
	"last_school_name" varchar(755),
	"last_school_address_id_fk" integer,
	"index_number_1" varchar(255),
	"index_number_2" varchar(255),
	"registration_number" varchar(255),
	"roll_number" varchar(255),
	"school_number" varchar(255),
	"center_number" varchar(255),
	"admit_card_id" varchar(255),
	"language_medium_id_fk" integer,
	"year_of_passing" integer NOT NULL,
	"studied_up_to_class" integer,
	"specialization_id" integer,
	"best_of_four" double precision,
	"total_score" double precision,
	"old_best_of_four" double precision,
	"old_total_score" double precision,
	"is_registered_for_ug_in_cu" boolean DEFAULT false,
	"cu_registration_number" varchar(255),
	"previously_registered_program_course_id_fk" integer,
	"other_previously_registered_program_course" varchar(500),
	"previous_institute_id_fk" integer,
	"other_previous_institute" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admission_program_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"admission_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"amount" integer DEFAULT 750 NOT NULL,
	"shift_id_fk" integer,
	"class_id_fk" integer,
	"is_active" boolean DEFAULT true,
	"is_closed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "admission_general_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_personal_details_id" integer,
	"application_form_id_fk" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"eligibility_criteria_id_fk" integer,
	"student_category_id_fk" integer,
	"personal_details_id_fk" integer,
	"is_minority" boolean DEFAULT false,
	"dtls" varchar(255),
	"gujarati_class" integer,
	"club_a_id" integer,
	"club_b_id" integer,
	"tshirt_size" varchar(255),
	"spqta_approved_by_user_id_fk" integer,
	"spqta_approved_date" date,
	"separated" boolean DEFAULT false,
	"chk_flats" varchar(255),
	"back_door_flag" integer,
	"health_id_fk" integer,
	"accommodation_id_fk" integer,
	"emergency_contact_id_fk" integer,
	"residence_of_kolkata" boolean NOT NULL,
	"bank_branch_id_fk" integer,
	"transport_details_id_fk" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id_fk" integer NOT NULL,
	"status" "admission_form_status" NOT NULL,
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
	"level" "degree_level_type" DEFAULT 'UNDER_GRADUATE' NOT NULL,
	"application_number" varchar(255) NOT NULL,
	"changed_application_number" varchar(255),
	"form_status" "admission_form_status",
	"admission_step" "admission_steps",
	"is_blocked" boolean DEFAULT false,
	"block_remarks" varchar(1000),
	"blocked_by_user_id_fk" integer,
	"blocked_date" timestamp,
	"adm_approved_by_user_id_fk" integer,
	"adm_approved_date" timestamp,
	"verify_type" varchar(100),
	"verify_remarks" varchar(1000),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"remarks" text
);
--> statement-breakpoint
CREATE TABLE "cancel_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_cancel_source_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "eligibility_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_eligibility_criteria_id" integer NOT NULL,
	"course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"category_id_fk" integer NOT NULL,
	"description" varchar(1000),
	"general_instruction" varchar(1000),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grade" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_grade_id" integer NOT NULL,
	"course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"category_id_fk" integer NOT NULL,
	"description" varchar(1000),
	"general_instruction" varchar(1000),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "merit_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_merit_list_id" integer,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"check_auto" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "paper_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"admission_course_details_id_fk" integer NOT NULL,
	"paper_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sports_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
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
	"legacy_subject_details_id" integer,
	"admission_academic_info_id_fk" integer NOT NULL,
	"board_subject_id_fk" integer NOT NULL,
	"theory_marks" double precision DEFAULT 0,
	"practical_marks" double precision DEFAULT 0,
	"total_marks" double precision DEFAULT 0,
	"grade_id_fk" integer,
	"result_status" "board_result_status_type",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(700) NOT NULL,
	"college_name" varchar(700) NOT NULL,
	"college_short_name" varchar(7) NOT NULL,
	"description" varchar(1000),
	"logo" varchar(5000),
	"url" varchar(1000) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"variant" "settings_variant_type" DEFAULT 'GENERAL' NOT NULL,
	"type" "settings_input_type" DEFAULT 'TEXT' NOT NULL,
	"name" varchar(700) NOT NULL,
	"value" varchar(700),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_name_unique" UNIQUE("name")
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
CREATE TABLE "affiliations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliations_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "batch_student_papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_student_mapping_id_fk" integer NOT NULL,
	"paper_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_headers" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_course_header_id" integer,
	"name" varchar(500) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_headers_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "course_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_levels_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "course_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_types_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_course_id" integer,
	"course_header_id_fk" integer,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "exam_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"code" varchar(500),
	"sequence" serial NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_components_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "paper_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"paper_id_fk" integer NOT NULL,
	"exam_component_id_fk" integer NOT NULL,
	"full_marks" double precision DEFAULT 0 NOT NULL,
	"credit" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id_fk" integer NOT NULL,
	"affiliation_id_fk" integer NOT NULL,
	"regulation_type_id_fk" integer NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"subject_type_id_fk" integer NOT NULL,
	"programe_course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"code" varchar(255) NOT NULL,
	"is_optional" boolean DEFAULT false,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"stream_id_fk" integer,
	"course_id_fk" integer,
	"course_type_id_fk" integer,
	"course_level_id_fk" integer,
	"duration" integer NOT NULL,
	"total_semesters" integer NOT NULL,
	"affiliation_id_fk" integer,
	"regulation_type_id_fk" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulation_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "regulation_types_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "specializations" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_specialization_id" integer,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "specializations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"code" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "streams_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "subject_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_subject_type_id" integer,
	"name" varchar(255),
	"code" varchar(255),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_types_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_subject_id" integer,
	"name" varchar(500) NOT NULL,
	"code" varchar(500),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"paper_id_fk" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"is_active" boolean DEFAULT true,
	"sequence" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "topics_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "addons" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_addon_id" integer,
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
	"legacy_fees_head_id" integer,
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
	"legacy_fees_receipt_type_id" integer,
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
	"legacy_fees_slab_id" integer,
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
	"start_date" date,
	"end_date" date,
	"online_start_date" date,
	"online_end_date" date,
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
CREATE TABLE "banks" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_bank_id" integer,
	"name" varchar(255) NOT NULL,
	"code" varchar(100),
	"address" varchar(500),
	"ifsc_code" varchar(20),
	"swift_code" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bank_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_bank_branch_id" integer,
	"bank_id_fk" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "annual_incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"range" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "annual_incomes_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "blood_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_blood_group_id" integer,
	"type" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blood_group_type_unique" UNIQUE("type"),
	CONSTRAINT "blood_group_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "board_result_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_board_result_status_id" integer,
	"name" varchar(255) NOT NULL,
	"spcl_type" varchar(255) NOT NULL,
	"result" "board_result_type",
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "board_result_status_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_board_id" integer,
	"name" varchar(700) NOT NULL,
	"degree_id" integer,
	"passing_marks" integer,
	"code" varchar(255),
	"address_id" integer,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "boards_name_unique" UNIQUE("name"),
	CONSTRAINT "boards_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_category_id" integer,
	"name" varchar(255) NOT NULL,
	"document_required" boolean,
	"code" varchar(10) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_code_unique" UNIQUE("code"),
	CONSTRAINT "categories_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_city_id" integer,
	"state_id" integer NOT NULL,
	"name" varchar(255),
	"document_required" boolean DEFAULT false NOT NULL,
	"code" varchar(10),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cities_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_country_id" integer,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name"),
	CONSTRAINT "countries_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "degree" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_degree_id" integer,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "degree_name_unique" UNIQUE("name"),
	CONSTRAINT "degree_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_district_id" integer,
	"city_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "districts_name_unique" UNIQUE("name"),
	CONSTRAINT "districts_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_institution_id" integer,
	"name" varchar(700) NOT NULL,
	"degree_id_fk" integer,
	"address_id_fk" integer,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "institutions_name_unique" UNIQUE("name"),
	CONSTRAINT "institutions_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "language_medium" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_language_medium_id" integer,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "language_medium_name_unique" UNIQUE("name"),
	CONSTRAINT "language_medium_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "nationality" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_nationality_id" integer,
	"name" varchar(255) NOT NULL,
	"code" integer,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nationality_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "occupations" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_occupation_id" integer,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "occupations_name_unique" UNIQUE("name"),
	CONSTRAINT "occupations_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "pickup_point" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_pickup_point_id" integer,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qualifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_qualification_id" integer,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qualifications_name_unique" UNIQUE("name"),
	CONSTRAINT "qualifications_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "religion" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_religion_id" integer,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "religion_name_unique" UNIQUE("name"),
	CONSTRAINT "religion_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_state_id" integer,
	"country_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "states_name_unique" UNIQUE("name"),
	CONSTRAINT "states_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "transport" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_transport_id" integer,
	"route_name" varchar(255),
	"mode" "transport_type" DEFAULT 'OTHER' NOT NULL,
	"vehicle_number" varchar(255),
	"driver_name" varchar(255),
	"provider_details" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_id" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(500) NOT NULL,
	"password" varchar(255) NOT NULL,
	"phone" varchar(255),
	"whatsapp_number" varchar(255),
	"image" varchar(255),
	"type" "user_type" NOT NULL,
	"is_suspended" boolean DEFAULT false,
	"suspended_reason" text,
	"suspended_till_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_student_id" integer,
	"user_id_fk" integer NOT NULL,
	"application_id_fk" integer,
	"program_course_id_fk" integer NOT NULL,
	"specialization_id_fk" integer,
	"uid" varchar(255),
	"rfid_number" varchar(255),
	"cu_form_number" varchar(255),
	"registration_number" varchar(255),
	"roll_number" varchar(255),
	"section_id_fk" integer,
	"shift_id_fk" integer NOT NULL,
	"class_roll_number" varchar(255),
	"apaar_id" varchar(255),
	"abc_id" varchar(255),
	"apprid" varchar(255),
	"check_repeat" boolean,
	"community" "community_type",
	"handicapped" boolean DEFAULT false,
	"last_passed_year" integer,
	"notes" text,
	"active" boolean,
	"alumni" boolean,
	"leaving_date" timestamp,
	"leaving_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accommodation" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_of_stay" "place_of_stay_type",
	"address_id_fk" integer,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id_fk" integer,
	"other_country" varchar(255),
	"state_id_fk" integer,
	"other_state" varchar(255),
	"city_id_fk" integer,
	"other_city" varchar(255),
	"district_id_fk" integer,
	"other_district" varchar(255),
	"address_line" varchar(1000),
	"landmark" varchar(255),
	"locality_type" "locality_type",
	"postoffice_id" integer,
	"other_postoffice" varchar(2000),
	"police_station_id" integer,
	"other_police_station" varchar(2000),
	"phone" varchar(255),
	"pincode" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_department_id" integer,
	"name" varchar(900) NOT NULL,
	"code" varchar(100) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "departments_name_unique" UNIQUE("name"),
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "disability_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_disability_code_id" integer,
	"code" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disability_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_name" varchar(255),
	"having_relation_as" varchar(255),
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
	"parent_type" "parent_type",
	"father_details_person_id_fk" integer,
	"mother_details_person_id_fk" integer,
	"guardian_details_person_id_fk" integer,
	"other_guardian_details_person_id_fk" integer,
	"spouse_details_person_id_fk" integer,
	"family_occupation_id_fk" integer,
	"annual_income_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health" (
	"id" serial PRIMARY KEY NOT NULL,
	"blood_group_id_fk" integer,
	"identification_mark" varchar(255),
	"height" varchar(255),
	"weight" varchar(255),
	"has_spectacles" boolean DEFAULT false,
	"spectacles_notes" varchar(255),
	"eye_power_left" numeric,
	"eye_power_right" numeric,
	"illness" varchar(255),
	"illness_notes" varchar(255),
	"allergy" varchar(255),
	"allergy_notes" varchar(255),
	"surgery" varchar(255),
	"surgery_notes" varchar(255),
	"is_infected_covid19" boolean DEFAULT false,
	"is_vaccinated_covid19" boolean DEFAULT false,
	"vaccine_name" varchar(255),
	"other_vaccine_name" varchar(255),
	"donated_blood" boolean DEFAULT false,
	"is_donating_blood" boolean DEFAULT false,
	"other_health_conditions" varchar(255),
	"other_health_conditions_notes" varchar(255),
	"past_medical_history" text,
	"past_surgical_history" text,
	"drug_allergy" text,
	"mediclaim_id_fk" integer,
	"mediclaim_file" varchar(900),
	"mediclaim_provider" varchar(255),
	"mediclaim_provider_number" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_title_type" "person_title_type",
	"name" varchar(255),
	"email" varchar(255),
	"phone" varchar(255),
	"aadhaar_card_number" varchar(255),
	"image" varchar(255),
	"gender" "gender_type",
	"marital_status" "marital_status_type",
	"qualification_id_fk" integer,
	"occupation_id_fk" integer,
	"office_addres_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"middle_name" varchar(255),
	"last_name" varchar(255),
	"whatsapp_number" varchar(15),
	"mobile_number" varchar(15) NOT NULL,
	"emergency_contact_number" varchar(15),
	"nationality_id_fk" integer,
	"other_nationality_id_fk" integer,
	"voter_id" varchar(255),
	"passport_number" varchar(255),
	"aadhaar_card_number" varchar(16),
	"religion_id_fk" integer,
	"category_id_fk" integer,
	"mother_tongue_language_medium_id_fk" integer,
	"date_of_birth" date,
	"place_of_birth" varchar(7000),
	"gender" "gender_type",
	"is_gujarati" boolean DEFAULT false,
	"marital_status" "marital_status_type",
	"mailing_address_id_fk" integer,
	"residential_address_id_fk" integer,
	"disability" "disability_type",
	"disablity_code_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"transport_id_fk" integer,
	"pickup_point_id_fk" integer,
	"seat_number" varchar(255),
	"pickup_time" time,
	"drop_off_time" time,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id_fk" integer NOT NULL,
	"attendance_code" varchar(255),
	"uid" varchar(255),
	"code_number" varchar(255),
	"rfid_number" varchar(255),
	"shift_id_fk" integer,
	"gratuity_number" varchar(255),
	"personal_details_id_fk" integer,
	"family_details_id_fk" integer,
	"student_category_id_fk" integer,
	"health_id_fk" integer,
	"emergency_contact_id_fk" integer,
	"computer_operation_known" boolean DEFAULT false,
	"last_school_attended_id_fk" integer,
	"medium1_id_fk" integer,
	"medium2_id_fk" integer,
	"last_college_attended_id_fk" integer,
	"board_id_fk" integer,
	"childrens" varchar(255),
	"major_child_name" varchar(255),
	"major_child_phone" varchar(255),
	"nominee_id_fk" integer,
	"previous_employee_name" varchar(255),
	"previous_employee_phone" varchar(255),
	"previous_employee_address_id_fk" integer,
	"bank_account_number" varchar(255),
	"bank_branch_id_fk" integer,
	"banl_ifsc_code" varchar(255),
	"bank_account_type" "bank_account_type",
	"provident_fund_account_number" varchar(255),
	"pan_number" varchar(255),
	"esi_number" varchar(255),
	"imp_number" varchar(255),
	"clinic_address" varchar(500),
	"has_pf_nomination" boolean DEFAULT false,
	"gratuity_nomination_date" timestamp,
	"univ_account_number" varchar(255),
	"date_of_confirmation" timestamp,
	"date_of_probation" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batch_student_mappings" ADD CONSTRAINT "batch_student_mappings_batch_id_fk_batches_id_fk" FOREIGN KEY ("batch_id_fk") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_student_mappings" ADD CONSTRAINT "batch_student_mappings_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_section_id_fk_sections_id_fk" FOREIGN KEY ("section_id_fk") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheet_paper_component_mapping" ADD CONSTRAINT "marksheet_paper_component_mapping_marksheet_paper_mapping_id_fk_marksheet_paper_mapping_id_fk" FOREIGN KEY ("marksheet_paper_mapping_id_fk") REFERENCES "public"."marksheet_paper_mapping"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheet_paper_component_mapping" ADD CONSTRAINT "marksheet_paper_component_mapping_paper_component_id_fk_paper_components_id_fk" FOREIGN KEY ("paper_component_id_fk") REFERENCES "public"."paper_components"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheet_paper_mapping" ADD CONSTRAINT "marksheet_paper_mapping_marksheet_id_fk_marksheets_id_fk" FOREIGN KEY ("marksheet_id_fk") REFERENCES "public"."marksheets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheet_paper_mapping" ADD CONSTRAINT "marksheet_paper_mapping_batch_student_paper_id_fk_batch_student_papers_id_fk" FOREIGN KEY ("batch_student_paper_id_fk") REFERENCES "public"."batch_student_papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheet_paper_mapping" ADD CONSTRAINT "marksheet_paper_mapping_year_of_appearance_id_fk_academic_years_id_fk" FOREIGN KEY ("year_of_appearance_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notice_attachments" ADD CONSTRAINT "notice_attachments_notice_id_fk_notices_id_fk" FOREIGN KEY ("notice_id_fk") REFERENCES "public"."notices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_academic_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_subjects" ADD CONSTRAINT "board_subjects_board_id_fk_boards_id_fk" FOREIGN KEY ("board_id_fk") REFERENCES "public"."boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_subjects" ADD CONSTRAINT "board_subjects_subject_id_fk_subjects_id_fk" FOREIGN KEY ("subject_id_fk") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_admission_program_course_id_fk_admission_program_courses_id_fk" FOREIGN KEY ("admission_program_course_id_fk") REFERENCES "public"."admission_program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_stream_id_fk_streams_id_fk" FOREIGN KEY ("stream_id_fk") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_eligibility_criteria_id_fk_eligibility_criteria_id_fk" FOREIGN KEY ("eligibility_criteria_id_fk") REFERENCES "public"."eligibility_criteria"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_student_category_id_fk_student_category_id_fk" FOREIGN KEY ("student_category_id_fk") REFERENCES "public"."student_category"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_verified_by_user_id_fk_users_id_fk" FOREIGN KEY ("verified_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_freeship_approved_by_user_id_fk_users_id_fk" FOREIGN KEY ("freeship_approved_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_fees_payment_bank_branch_id_fk_bank_branches_id_fk" FOREIGN KEY ("fees_payment_bank_branch_id_fk") REFERENCES "public"."bank_branches"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_fees_payment_bank_id_banks_id_fk" FOREIGN KEY ("fees_payment_bank_id") REFERENCES "public"."banks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_specialization_id_fk_specializations_id_fk" FOREIGN KEY ("specialization_id_fk") REFERENCES "public"."specializations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_merit_list_id_fk_merit_lists_id_fk" FOREIGN KEY ("merit_list_id_fk") REFERENCES "public"."merit_lists"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_merit_list_by_user_id_fk_users_id_fk" FOREIGN KEY ("merit_list_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_cancel_source_id_cancel_sources_id_fk" FOREIGN KEY ("cancel_source_id") REFERENCES "public"."cancel_sources"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_course_details" ADD CONSTRAINT "admission_course_details_cancel_by_user_id_fk_users_id_fk" FOREIGN KEY ("cancel_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_category" ADD CONSTRAINT "student_category_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_category" ADD CONSTRAINT "student_category_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "adm_subject_paper_selections" ADD CONSTRAINT "adm_subject_paper_selections_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "adm_subject_paper_selections" ADD CONSTRAINT "adm_subject_paper_selections_admission_course_details_id_fk_admission_course_details_id_fk" FOREIGN KEY ("admission_course_details_id_fk") REFERENCES "public"."admission_course_details"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "adm_subject_paper_selections" ADD CONSTRAINT "adm_subject_paper_selections_paper_id_fk_papers_id_fk" FOREIGN KEY ("paper_id_fk") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_family_details_id_fk_family_details_id_fk" FOREIGN KEY ("family_details_id_fk") REFERENCES "public"."family_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_department_of_staff_parent_fk_departments_id_fk" FOREIGN KEY ("department_of_staff_parent_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_family_ex_student_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("family_ex_student_program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_additional_info" ADD CONSTRAINT "admission_additional_info_annual_income_id_fk_annual_incomes_id_fk" FOREIGN KEY ("annual_income_id_fk") REFERENCES "public"."annual_incomes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_board_id_fk_boards_id_fk" FOREIGN KEY ("board_id_fk") REFERENCES "public"."boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_last_school_id_fk_institutions_id_fk" FOREIGN KEY ("last_school_id_fk") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_last_school_address_id_fk_address_id_fk" FOREIGN KEY ("last_school_address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_language_medium_id_fk_language_medium_id_fk" FOREIGN KEY ("language_medium_id_fk") REFERENCES "public"."language_medium"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_specialization_id_specializations_id_fk" FOREIGN KEY ("specialization_id") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_previously_registered_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("previously_registered_program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_academic_info" ADD CONSTRAINT "admission_academic_info_previous_institute_id_fk_institutions_id_fk" FOREIGN KEY ("previous_institute_id_fk") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_program_courses" ADD CONSTRAINT "admission_program_courses_admission_id_fk_admissions_id_fk" FOREIGN KEY ("admission_id_fk") REFERENCES "public"."admissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_program_courses" ADD CONSTRAINT "admission_program_courses_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_program_courses" ADD CONSTRAINT "admission_program_courses_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_program_courses" ADD CONSTRAINT "admission_program_courses_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_application_form_id_fk_application_forms_id_fk" FOREIGN KEY ("application_form_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_eligibility_criteria_id_fk_eligibility_criteria_id_fk" FOREIGN KEY ("eligibility_criteria_id_fk") REFERENCES "public"."eligibility_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_student_category_id_fk_student_category_id_fk" FOREIGN KEY ("student_category_id_fk") REFERENCES "public"."student_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_personal_details_id_fk_personal_details_id_fk" FOREIGN KEY ("personal_details_id_fk") REFERENCES "public"."personal_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_spqta_approved_by_user_id_fk_users_id_fk" FOREIGN KEY ("spqta_approved_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_health_id_fk_health_id_fk" FOREIGN KEY ("health_id_fk") REFERENCES "public"."health"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_accommodation_id_fk_accommodation_id_fk" FOREIGN KEY ("accommodation_id_fk") REFERENCES "public"."accommodation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_emergency_contact_id_fk_emergency_contacts_id_fk" FOREIGN KEY ("emergency_contact_id_fk") REFERENCES "public"."emergency_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_bank_branch_id_fk_bank_branches_id_fk" FOREIGN KEY ("bank_branch_id_fk") REFERENCES "public"."bank_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_general_info" ADD CONSTRAINT "admission_general_info_transport_details_id_fk_transport_details_id_fk" FOREIGN KEY ("transport_details_id_fk") REFERENCES "public"."transport_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_forms" ADD CONSTRAINT "application_forms_admission_id_fk_admissions_id_fk" FOREIGN KEY ("admission_id_fk") REFERENCES "public"."admissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_forms" ADD CONSTRAINT "application_forms_blocked_by_user_id_fk_users_id_fk" FOREIGN KEY ("blocked_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_forms" ADD CONSTRAINT "application_forms_adm_approved_by_user_id_fk_users_id_fk" FOREIGN KEY ("adm_approved_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_category_id_fk_categories_id_fk" FOREIGN KEY ("category_id_fk") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_category_id_fk_categories_id_fk" FOREIGN KEY ("category_id_fk") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "paper_selections" ADD CONSTRAINT "paper_selections_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "paper_selections" ADD CONSTRAINT "paper_selections_admission_course_details_id_fk_admission_course_details_id_fk" FOREIGN KEY ("admission_course_details_id_fk") REFERENCES "public"."admission_course_details"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "paper_selections" ADD CONSTRAINT "paper_selections_paper_id_fk_papers_id_fk" FOREIGN KEY ("paper_id_fk") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "sports_info" ADD CONSTRAINT "sports_info_additional_info_id_fk_admission_additional_info_id_fk" FOREIGN KEY ("additional_info_id_fk") REFERENCES "public"."admission_additional_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sports_info" ADD CONSTRAINT "sports_info_sports_category_id_fk_sports_categories_id_fk" FOREIGN KEY ("sports_category_id_fk") REFERENCES "public"."sports_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_academic_subjects" ADD CONSTRAINT "student_academic_subjects_admission_academic_info_id_fk_admission_academic_info_id_fk" FOREIGN KEY ("admission_academic_info_id_fk") REFERENCES "public"."admission_academic_info"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_academic_subjects" ADD CONSTRAINT "student_academic_subjects_board_subject_id_fk_board_subjects_id_fk" FOREIGN KEY ("board_subject_id_fk") REFERENCES "public"."board_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_academic_subjects" ADD CONSTRAINT "student_academic_subjects_grade_id_fk_grade_id_fk" FOREIGN KEY ("grade_id_fk") REFERENCES "public"."grade"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_student_papers" ADD CONSTRAINT "batch_student_papers_batch_student_mapping_id_fk_batch_student_mappings_id_fk" FOREIGN KEY ("batch_student_mapping_id_fk") REFERENCES "public"."batch_student_mappings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_student_papers" ADD CONSTRAINT "batch_student_papers_paper_id_fk_papers_id_fk" FOREIGN KEY ("paper_id_fk") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_course_header_id_fk_course_headers_id_fk" FOREIGN KEY ("course_header_id_fk") REFERENCES "public"."course_headers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_components" ADD CONSTRAINT "paper_components_paper_id_fk_papers_id_fk" FOREIGN KEY ("paper_id_fk") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_components" ADD CONSTRAINT "paper_components_exam_component_id_fk_exam_components_id_fk" FOREIGN KEY ("exam_component_id_fk") REFERENCES "public"."exam_components"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_subject_id_fk_subjects_id_fk" FOREIGN KEY ("subject_id_fk") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_affiliation_id_fk_affiliations_id_fk" FOREIGN KEY ("affiliation_id_fk") REFERENCES "public"."affiliations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_regulation_type_id_fk_regulation_types_id_fk" FOREIGN KEY ("regulation_type_id_fk") REFERENCES "public"."regulation_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_subject_type_id_fk_subject_types_id_fk" FOREIGN KEY ("subject_type_id_fk") REFERENCES "public"."subject_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_programe_course_id_fk_program_courses_id_fk" FOREIGN KEY ("programe_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_stream_id_fk_streams_id_fk" FOREIGN KEY ("stream_id_fk") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_course_type_id_fk_course_types_id_fk" FOREIGN KEY ("course_type_id_fk") REFERENCES "public"."course_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_course_level_id_fk_course_levels_id_fk" FOREIGN KEY ("course_level_id_fk") REFERENCES "public"."course_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_affiliation_id_fk_affiliations_id_fk" FOREIGN KEY ("affiliation_id_fk") REFERENCES "public"."affiliations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_regulation_type_id_fk_regulation_types_id_fk" FOREIGN KEY ("regulation_type_id_fk") REFERENCES "public"."regulation_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_paper_id_fk_papers_id_fk" FOREIGN KEY ("paper_id_fk") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "bank_branches" ADD CONSTRAINT "bank_branches_bank_id_fk_banks_id_fk" FOREIGN KEY ("bank_id_fk") REFERENCES "public"."banks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_degree_id_degree_id_fk" FOREIGN KEY ("degree_id") REFERENCES "public"."degree"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_degree_id_fk_degree_id_fk" FOREIGN KEY ("degree_id_fk") REFERENCES "public"."degree"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_address_id_fk_address_id_fk" FOREIGN KEY ("address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "states" ADD CONSTRAINT "states_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_application_id_fk_application_forms_id_fk" FOREIGN KEY ("application_id_fk") REFERENCES "public"."application_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_specialization_id_fk_specializations_id_fk" FOREIGN KEY ("specialization_id_fk") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_section_id_fk_sections_id_fk" FOREIGN KEY ("section_id_fk") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "accommodation" ADD CONSTRAINT "accommodation_address_id_fk_address_id_fk" FOREIGN KEY ("address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_country_id_fk_countries_id_fk" FOREIGN KEY ("country_id_fk") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_state_id_fk_states_id_fk" FOREIGN KEY ("state_id_fk") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_city_id_fk_cities_id_fk" FOREIGN KEY ("city_id_fk") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_district_id_fk_districts_id_fk" FOREIGN KEY ("district_id_fk") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_father_details_person_id_fk_person_id_fk" FOREIGN KEY ("father_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_mother_details_person_id_fk_person_id_fk" FOREIGN KEY ("mother_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_guardian_details_person_id_fk_person_id_fk" FOREIGN KEY ("guardian_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_other_guardian_details_person_id_fk_person_id_fk" FOREIGN KEY ("other_guardian_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_spouse_details_person_id_fk_person_id_fk" FOREIGN KEY ("spouse_details_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_family_occupation_id_fk_occupations_id_fk" FOREIGN KEY ("family_occupation_id_fk") REFERENCES "public"."occupations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_details" ADD CONSTRAINT "family_details_annual_income_id_fk_annual_incomes_id_fk" FOREIGN KEY ("annual_income_id_fk") REFERENCES "public"."annual_incomes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health" ADD CONSTRAINT "health_blood_group_id_fk_blood_group_id_fk" FOREIGN KEY ("blood_group_id_fk") REFERENCES "public"."blood_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_qualification_id_fk_qualifications_id_fk" FOREIGN KEY ("qualification_id_fk") REFERENCES "public"."qualifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_occupation_id_fk_occupations_id_fk" FOREIGN KEY ("occupation_id_fk") REFERENCES "public"."occupations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_office_addres_id_fk_address_id_fk" FOREIGN KEY ("office_addres_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_nationality_id_fk_nationality_id_fk" FOREIGN KEY ("nationality_id_fk") REFERENCES "public"."nationality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_other_nationality_id_fk_nationality_id_fk" FOREIGN KEY ("other_nationality_id_fk") REFERENCES "public"."nationality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_religion_id_fk_religion_id_fk" FOREIGN KEY ("religion_id_fk") REFERENCES "public"."religion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_category_id_fk_categories_id_fk" FOREIGN KEY ("category_id_fk") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_mother_tongue_language_medium_id_fk_language_medium_id_fk" FOREIGN KEY ("mother_tongue_language_medium_id_fk") REFERENCES "public"."language_medium"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_mailing_address_id_fk_address_id_fk" FOREIGN KEY ("mailing_address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_residential_address_id_fk_address_id_fk" FOREIGN KEY ("residential_address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_details" ADD CONSTRAINT "personal_details_disablity_code_id_fk_disability_codes_id_fk" FOREIGN KEY ("disablity_code_id_fk") REFERENCES "public"."disability_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_details" ADD CONSTRAINT "transport_details_transport_id_fk_transport_id_fk" FOREIGN KEY ("transport_id_fk") REFERENCES "public"."transport"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_details" ADD CONSTRAINT "transport_details_pickup_point_id_fk_pickup_point_id_fk" FOREIGN KEY ("pickup_point_id_fk") REFERENCES "public"."pickup_point"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_personal_details_id_fk_personal_details_id_fk" FOREIGN KEY ("personal_details_id_fk") REFERENCES "public"."personal_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_family_details_id_fk_family_details_id_fk" FOREIGN KEY ("family_details_id_fk") REFERENCES "public"."family_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_student_category_id_fk_student_category_id_fk" FOREIGN KEY ("student_category_id_fk") REFERENCES "public"."student_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_health_id_fk_health_id_fk" FOREIGN KEY ("health_id_fk") REFERENCES "public"."health"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_emergency_contact_id_fk_emergency_contacts_id_fk" FOREIGN KEY ("emergency_contact_id_fk") REFERENCES "public"."emergency_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_last_school_attended_id_fk_institutions_id_fk" FOREIGN KEY ("last_school_attended_id_fk") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_medium1_id_fk_language_medium_id_fk" FOREIGN KEY ("medium1_id_fk") REFERENCES "public"."language_medium"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_medium2_id_fk_language_medium_id_fk" FOREIGN KEY ("medium2_id_fk") REFERENCES "public"."language_medium"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_last_college_attended_id_fk_institutions_id_fk" FOREIGN KEY ("last_college_attended_id_fk") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_board_id_fk_boards_id_fk" FOREIGN KEY ("board_id_fk") REFERENCES "public"."boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_nominee_id_fk_person_id_fk" FOREIGN KEY ("nominee_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_previous_employee_address_id_fk_address_id_fk" FOREIGN KEY ("previous_employee_address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_bank_branch_id_fk_bank_branches_id_fk" FOREIGN KEY ("bank_branch_id_fk") REFERENCES "public"."bank_branches"("id") ON DELETE no action ON UPDATE no action;