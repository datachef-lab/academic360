CREATE TYPE "public"."access_group_module_permission_type" AS ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'UPLOAD');--> statement-breakpoint
CREATE TYPE "public"."access_group_module_type" AS ENUM('STATIC', 'CONDITIONAL');--> statement-breakpoint
CREATE TYPE "public"."access_group_type" AS ENUM('BASIC', 'ADD-ON', 'SPECIAL');--> statement-breakpoint
CREATE TABLE "access_group_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_group_id_fk" integer NOT NULL,
	"type" "academic360_application_domain_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_access_group__user_type" UNIQUE("access_group_id_fk","type")
);
--> statement-breakpoint
CREATE TABLE "access_group__designation" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_group_id_fk" integer NOT NULL,
	"designation_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_access_group_designation" UNIQUE("access_group_id_fk","designation_id_fk")
);
--> statement-breakpoint
CREATE TABLE "access_group_module__class" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_group_module_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"is_allowed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_access_group_module_class" UNIQUE("access_group_module_id_fk","class_id_fk")
);
--> statement-breakpoint
CREATE TABLE "access_group_module_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_group_module_id_fk" integer NOT NULL,
	"type" "access_group_module_permission_type" DEFAULT 'READ' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_access_group_module_permission_type" UNIQUE("access_group_module_id_fk","type")
);
--> statement-breakpoint
CREATE TABLE "access_group_module__program_course" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_group_module_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"is_allowed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_access_group_module_program_course" UNIQUE("access_group_module_id_fk","program_course_id_fk")
);
--> statement-breakpoint
CREATE TABLE "access_group__module" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_group_id_fk" integer NOT NULL,
	"app_module_id_fk" integer NOT NULL,
	"type" "access_group_module_type" DEFAULT 'STATIC' NOT NULL,
	"is_allowed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_access_group_module" UNIQUE("access_group_id_fk","app_module_id_fk")
);
--> statement-breakpoint
CREATE TABLE "access_group__user_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"access_group_id_fk" integer NOT NULL,
	"user_type_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_access_group_user_type" UNIQUE("access_group_id_fk","user_type_id_fk")
);
--> statement-breakpoint
CREATE TABLE "access_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "access_group_type" DEFAULT 'BASIC' NOT NULL,
	"user_status_id_fk" integer NOT NULL,
	"code" varchar(255),
	"description" varchar(1000),
	"remarks" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_name_user_status" UNIQUE("name","type","user_status_id_fk")
);
--> statement-breakpoint
CREATE TABLE "designations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"code" varchar(255),
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "designations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "identity_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id_fk" integer NOT NULL,
	"first_name" varchar(500) NOT NULL,
	"middle_name" varchar(500),
	"last_name" varchar(500),
	"email" varchar(500),
	"alternative_email" varchar(500),
	"phone" varchar(15),
	"date_of_birth" date,
	"gender" "gender_type",
	"whatsapp_number" varchar(15),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_session_name_email_phone_dob_gender" UNIQUE("session_id_fk","first_name","middle_name","last_name","email","alternative_email","phone","date_of_birth","gender","whatsapp_number")
);
--> statement-breakpoint
CREATE TABLE "institutional_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"identity_master_id_fk" integer NOT NULL,
	"user_type_id_fk" integer NOT NULL,
	"valid_till" timestamp with time zone,
	"is_primary" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id_fk" integer NOT NULL,
	"user_id_fk" integer NOT NULL,
	"user_status_master_id_fk" integer NOT NULL,
	"remarks" varchar(500),
	"suspended_till_date" timestamp with time zone,
	"by_user_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_session_role_user_status" UNIQUE("session_id_fk","user_id_fk","user_status_master_id_fk")
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "users" DROP CONSTRAINT "users_user_type_id_fk_user_types_id_fk"; EXCEPTION WHEN undefined_object OR undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "fee_student_mappings" ADD COLUMN "challan_generated_at" timestamp with time zone; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "users" ADD COLUMN "institutional_role_id_fk" integer; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_statuses_master" ADD COLUMN "user_type_id_fk" integer; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_types" ADD COLUMN "parent_user_type_id_fk" integer; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_types" ADD COLUMN "allowed_designation_filtering" boolean DEFAULT false NOT NULL; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_types" ADD COLUMN "allowed_module_type_filtering" boolean DEFAULT false NOT NULL; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
ALTER TABLE "access_group_applications" ADD CONSTRAINT "access_group_applications_access_group_id_fk_access_groups_id_fk" FOREIGN KEY ("access_group_id_fk") REFERENCES "public"."access_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group__designation" ADD CONSTRAINT "access_group__designation_access_group_id_fk_access_groups_id_fk" FOREIGN KEY ("access_group_id_fk") REFERENCES "public"."access_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group__designation" ADD CONSTRAINT "access_group__designation_designation_id_fk_designations_id_fk" FOREIGN KEY ("designation_id_fk") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group_module__class" ADD CONSTRAINT "access_group_module__class_access_group_module_id_fk_access_group__module_id_fk" FOREIGN KEY ("access_group_module_id_fk") REFERENCES "public"."access_group__module"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group_module__class" ADD CONSTRAINT "access_group_module__class_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group_module_permissions" ADD CONSTRAINT "access_group_module_permissions_access_group_module_id_fk_access_group__module_id_fk" FOREIGN KEY ("access_group_module_id_fk") REFERENCES "public"."access_group__module"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group_module__program_course" ADD CONSTRAINT "access_group_module__program_course_access_group_module_id_fk_access_group__module_id_fk" FOREIGN KEY ("access_group_module_id_fk") REFERENCES "public"."access_group__module"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group_module__program_course" ADD CONSTRAINT "access_group_module__program_course_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group__module" ADD CONSTRAINT "access_group__module_access_group_id_fk_access_groups_id_fk" FOREIGN KEY ("access_group_id_fk") REFERENCES "public"."access_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group__module" ADD CONSTRAINT "access_group__module_app_module_id_fk_app_modules_id_fk" FOREIGN KEY ("app_module_id_fk") REFERENCES "public"."app_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group__user_type" ADD CONSTRAINT "access_group__user_type_access_group_id_fk_access_groups_id_fk" FOREIGN KEY ("access_group_id_fk") REFERENCES "public"."access_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_group__user_type" ADD CONSTRAINT "access_group__user_type_user_type_id_fk_user_types_id_fk" FOREIGN KEY ("user_type_id_fk") REFERENCES "public"."user_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_groups" ADD CONSTRAINT "access_groups_user_status_id_fk_user_statuses_master_id_fk" FOREIGN KEY ("user_status_id_fk") REFERENCES "public"."user_statuses_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_master" ADD CONSTRAINT "identity_master_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_roles" ADD CONSTRAINT "institutional_roles_identity_master_id_fk_identity_master_id_fk" FOREIGN KEY ("identity_master_id_fk") REFERENCES "public"."identity_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_roles" ADD CONSTRAINT "institutional_roles_user_type_id_fk_user_types_id_fk" FOREIGN KEY ("user_type_id_fk") REFERENCES "public"."user_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_statuses" ADD CONSTRAINT "session_statuses_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_statuses" ADD CONSTRAINT "session_statuses_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_statuses" ADD CONSTRAINT "session_statuses_user_status_master_id_fk_user_statuses_master_id_fk" FOREIGN KEY ("user_status_master_id_fk") REFERENCES "public"."user_statuses_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_statuses" ADD CONSTRAINT "session_statuses_by_user_id_fk_users_id_fk" FOREIGN KEY ("by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_institutional_role_id_fk_institutional_roles_id_fk" FOREIGN KEY ("institutional_role_id_fk") REFERENCES "public"."institutional_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_statuses_master" ADD CONSTRAINT "user_statuses_master_user_type_id_fk_user_types_id_fk" FOREIGN KEY ("user_type_id_fk") REFERENCES "public"."user_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_types" ADD CONSTRAINT "user_types_parent_user_type_id_fk_user_types_id_fk" FOREIGN KEY ("parent_user_type_id_fk") REFERENCES "public"."user_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "user_type_id_fk";