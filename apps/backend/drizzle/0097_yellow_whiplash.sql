DO $$ BEGIN
    CREATE TYPE "public"."academic360_application_domain_type" AS ENUM (
        'MAIN_CONSOLE',
        'STUDENT_CONSOLE',
        'STUDENT_CONSOLE_MOBILE',
        'EXAM_ATTENDANCE_APP',
        'ID_CARD_GENERATOR',
        'EVENT_GATEKEEPER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."user_status_master_frequency_type" AS ENUM('ALWAYS_NEW_ENTRY', 'PER_ACADEMIC_YEAR', 'PER_SEMESTER', 'ONLY_ONCE', 'REQUIRED', 'OPTIONAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
    CREATE TYPE "public"."user_status_master_level_type" AS ENUM('SYSTEM', 'ACADEMIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE "app_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_app_module_id_fk" integer,
	"name" varchar(500) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"module_url" varchar(1000) NOT NULL,
	"image" varchar(5000),
	"is_master_module" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_modules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "department_designation_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id_fk" integer NOT NULL,
	"designation_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_dept_designation" UNIQUE("department_id_fk","designation_id_fk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_group_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_group_id_fk" integer NOT NULL,
	"domain" "academic360_application_domain_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_domain" UNIQUE("user_group_id_fk","domain")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_group_designations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_group_id_fk" integer NOT NULL,
	"designation_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_designation" UNIQUE("user_group_id_fk","designation_id_fk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_group_id_fk" integer NOT NULL,
	"member" "user_type" NOT NULL,
	"user_type_id_fk" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_member" UNIQUE("user_group_id_fk","member")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" varchar(500),
	"code" varchar(255),
	"sequence" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_privilege_sub_program_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_privilege_sub_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"is_accessible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_privilege_sub_program_course" UNIQUE("user_privilege_sub_id_fk","program_course_id_fk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_privilege_sub_scopes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_privilege_sub_id_fk" integer NOT NULL,
	"department_id_fk" integer,
	"designation_id_fk" integer,
	"is_accessible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_privilege_sub_scope" UNIQUE("user_privilege_sub_id_fk","department_id_fk","designation_id_fk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_privilege_sub" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_privilege_id_fk" integer NOT NULL,
	"app_module_id_fk" integer NOT NULL,
	"is_accessible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_app_module_program_course_department" UNIQUE("user_privilege_id_fk","app_module_id_fk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_privileges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_group_id_fk" integer NOT NULL,
	"user_status_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_status" UNIQUE("user_group_id_fk","user_status_id_fk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_staff_designation_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id_fk" integer NOT NULL,
	"department_id_fk" integer,
	"designation_id_fk" integer NOT NULL,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_staff_designation_dept" UNIQUE("staff_id_fk","designation_id_fk","department_id_fk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_status_reasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_status_id_fk" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"remarks" varchar(500),
	"is_terminal" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_status" UNIQUE("user_status_id_fk","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_status_session_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id_fk" integer NOT NULL,
	"session_id_fk" integer NOT NULL,
	"user_status_reason_id_fk" integer,
	"suspended_till_date" timestamp with time zone,
	"remarks" varchar(255),
	"by_user_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_session_status_reason" UNIQUE("user_id_fk","session_id_fk","user_status_reason_id_fk")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"code" varchar(255),
	"is_deletable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint

DO $$ BEGIN
    CREATE TYPE "public"."user_status_master_type" AS ENUM('ACTIVE', 'IN_ACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "user_statuses_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "user_status_master_type" NOT NULL,
	"tag" varchar(255) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"remarks" varchar(255),
	"coexistence" varchar(2000),
	"enrollment_status" varchar(255) NOT NULL,
	"is_academic_records_accessible" boolean DEFAULT false NOT NULL,
	"has_fee_payment_eligibility" boolean DEFAULT false NOT NULL,
	"is_form_fillup_inclusive" boolean DEFAULT false NOT NULL,
	"is_exam_inclusive" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_statuses_master_tag_unique" UNIQUE("tag"),
	CONSTRAINT "user_statuses_master_enrollmentStatus_unique" UNIQUE("enrollment_status")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "user_status_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_status_master_id_fk" integer NOT NULL,
	"user_id_fk" integer NOT NULL,
	"staff_id_fk" integer,
	"student_id_fk" integer,
	"promotion_id_fk" integer,
	"suspended_reason" varchar(255),
	"suspended_till_date" timestamp with time zone,
	"remarks" varchar(255),
	"by_user_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);


DO $$ BEGIN
    ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_user_status_master_id_fk_user_statuses_master_id_fk" FOREIGN KEY ("user_status_master_id_fk") REFERENCES "public"."user_statuses_master"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_staff_id_fk_staffs_id_fk" FOREIGN KEY ("staff_id_fk") REFERENCES "public"."staffs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_promotion_id_fk_promotions_id_fk" FOREIGN KEY ("promotion_id_fk") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_by_user_id_fk_users_id_fk" FOREIGN KEY ("by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_mapping" ADD COLUMN "session_id_fk" integer NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "user_status_mapping" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS "user_status_mapping" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_statuses_master_domain" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_status_master_frequency" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_status_master_level" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_statuses_master" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "sub_departments" CASCADE;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "users" ADD COLUMN "user_type_id_fk" integer;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "departments" ADD COLUMN "parent_department_id_fk" integer;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "app_modules" ADD CONSTRAINT "app_modules_parent_app_module_id_fk_app_modules_id_fk" FOREIGN KEY ("parent_app_module_id_fk") REFERENCES "public"."app_modules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "department_designation_mapping" ADD CONSTRAINT "department_designation_mapping_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "department_designation_mapping" ADD CONSTRAINT "department_designation_mapping_designation_id_fk_designations_id_fk" FOREIGN KEY ("designation_id_fk") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_group_domains" ADD CONSTRAINT "user_group_domains_user_group_id_fk_user_groups_id_fk" FOREIGN KEY ("user_group_id_fk") REFERENCES "public"."user_groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_group_designations" ADD CONSTRAINT "user_group_designations_user_group_id_fk_user_groups_id_fk" FOREIGN KEY ("user_group_id_fk") REFERENCES "public"."user_groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_group_designations" ADD CONSTRAINT "user_group_designations_designation_id_fk_designations_id_fk" FOREIGN KEY ("designation_id_fk") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_user_group_id_fk_user_groups_id_fk" FOREIGN KEY ("user_group_id_fk") REFERENCES "public"."user_groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_user_type_id_fk_user_types_id_fk" FOREIGN KEY ("user_type_id_fk") REFERENCES "public"."user_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_privilege_sub_program_courses" ADD CONSTRAINT "user_privilege_sub_program_courses_user_privilege_sub_id_fk_user_privilege_sub_id_fk" FOREIGN KEY ("user_privilege_sub_id_fk") REFERENCES "public"."user_privilege_sub"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_privilege_sub_program_courses" ADD CONSTRAINT "user_privilege_sub_program_courses_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_privilege_sub_scopes" ADD CONSTRAINT "user_privilege_sub_scopes_user_privilege_sub_id_fk_user_privilege_sub_id_fk" FOREIGN KEY ("user_privilege_sub_id_fk") REFERENCES "public"."user_privilege_sub"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_privilege_sub_scopes" ADD CONSTRAINT "user_privilege_sub_scopes_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_privilege_sub_scopes" ADD CONSTRAINT "user_privilege_sub_scopes_designation_id_fk_designations_id_fk" FOREIGN KEY ("designation_id_fk") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_privilege_sub" ADD CONSTRAINT "user_privilege_sub_user_privilege_id_fk_user_privileges_id_fk" FOREIGN KEY ("user_privilege_id_fk") REFERENCES "public"."user_privileges"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_privilege_sub" ADD CONSTRAINT "user_privilege_sub_app_module_id_fk_app_modules_id_fk" FOREIGN KEY ("app_module_id_fk") REFERENCES "public"."app_modules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_privileges" ADD CONSTRAINT "user_privileges_user_group_id_fk_user_groups_id_fk" FOREIGN KEY ("user_group_id_fk") REFERENCES "public"."user_groups"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_privileges" ADD CONSTRAINT "user_privileges_user_status_id_fk_user_statuses_id_fk" FOREIGN KEY ("user_status_id_fk") REFERENCES "public"."user_statuses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_staff_designation_mapping" ADD CONSTRAINT "user_staff_designation_mapping_staff_id_fk_staffs_id_fk" FOREIGN KEY ("staff_id_fk") REFERENCES "public"."staffs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_staff_designation_mapping" ADD CONSTRAINT "user_staff_designation_mapping_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_staff_designation_mapping" ADD CONSTRAINT "user_staff_designation_mapping_designation_id_fk_designations_id_fk" FOREIGN KEY ("designation_id_fk") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_reasons" ADD CONSTRAINT "user_status_reasons_user_status_id_fk_user_statuses_id_fk" FOREIGN KEY ("user_status_id_fk") REFERENCES "public"."user_statuses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_session_mapping" ADD CONSTRAINT "user_status_session_mapping_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_session_mapping" ADD CONSTRAINT "user_status_session_mapping_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_session_mapping" ADD CONSTRAINT "user_status_session_mapping_user_status_reason_id_fk_user_status_reasons_id_fk" FOREIGN KEY ("user_status_reason_id_fk") REFERENCES "public"."user_status_reasons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "user_status_session_mapping" ADD CONSTRAINT "user_status_session_mapping_by_user_id_fk_users_id_fk" FOREIGN KEY ("by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_user_type_id_fk_user_types_id_fk" FOREIGN KEY ("user_type_id_fk") REFERENCES "public"."user_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_department_id_fk_departments_id_fk" FOREIGN KEY ("parent_department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DROP TYPE "public"."user_status_master_frequency_type";--> statement-breakpoint
DROP TYPE "public"."user_status_master_level_type";--> statement-breakpoint
DROP TYPE "public"."user_status_master_type";