CREATE TYPE "public"."academic360_application_domain_type" AS ENUM('MAIN_CONSOLE', 'STUDENT_CONSOLE', 'STUDENT_CONSOLE_MOBILE', 'EXAM_ATTENDANCE_APP', 'ID_CARD_GENERATOR', 'EVENT_GATEKEEPER');--> statement-breakpoint
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
CREATE TABLE "user_group_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_group_id_fk" integer NOT NULL,
	"domain" "academic360_application_domain_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_domain" UNIQUE("user_group_id_fk","domain")
);
--> statement-breakpoint
CREATE TABLE "user_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_group_id_fk" integer NOT NULL,
	"member" "user_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_member" UNIQUE("user_group_id_fk","member")
);
--> statement-breakpoint
CREATE TABLE "user_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"code" varchar(255),
	"sequence" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_privilege_sub" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_privilege_id_fk" integer NOT NULL,
	"app_module_id_fk" integer NOT NULL,
	"program_course_id_fk" integer,
	"department_id_fk" integer,
	"is_accessible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_app_module_program_course_department" UNIQUE("user_privilege_id_fk","app_module_id_fk","program_course_id_fk","department_id_fk")
);
--> statement-breakpoint
CREATE TABLE "user_privileges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_group_id_fk" integer NOT NULL,
	"user_status_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_status" UNIQUE("user_group_id_fk","user_status_id_fk")
);
--> statement-breakpoint
CREATE TABLE "user_staff_depatment_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id_fk" integer NOT NULL,
	"department_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_staff_department" UNIQUE("staff_id_fk","department_id_fk")
);
--> statement-breakpoint
CREATE TABLE "user_status_reasons" (
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
CREATE TABLE "user_status_session_mapping" (
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
CREATE TABLE "user_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "user_status_mapping" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_statuses_master_domain" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_status_master_frequency" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_status_master_level" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_statuses_master" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sub_departments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_status_mapping" CASCADE;--> statement-breakpoint
DROP TABLE "user_statuses_master_domain" CASCADE;--> statement-breakpoint
DROP TABLE "user_status_master_frequency" CASCADE;--> statement-breakpoint
DROP TABLE "user_status_master_level" CASCADE;--> statement-breakpoint
DROP TABLE "user_statuses_master" CASCADE;--> statement-breakpoint
DROP TABLE "sub_departments" CASCADE;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "parent_department_id_fk" integer;--> statement-breakpoint
ALTER TABLE "app_modules" ADD CONSTRAINT "app_modules_parent_app_module_id_fk_app_modules_id_fk" FOREIGN KEY ("parent_app_module_id_fk") REFERENCES "public"."app_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group_domains" ADD CONSTRAINT "user_group_domains_user_group_id_fk_user_groups_id_fk" FOREIGN KEY ("user_group_id_fk") REFERENCES "public"."user_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_user_group_id_fk_user_groups_id_fk" FOREIGN KEY ("user_group_id_fk") REFERENCES "public"."user_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub" ADD CONSTRAINT "user_privilege_sub_user_privilege_id_fk_user_privileges_id_fk" FOREIGN KEY ("user_privilege_id_fk") REFERENCES "public"."user_privileges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub" ADD CONSTRAINT "user_privilege_sub_app_module_id_fk_app_modules_id_fk" FOREIGN KEY ("app_module_id_fk") REFERENCES "public"."app_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub" ADD CONSTRAINT "user_privilege_sub_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub" ADD CONSTRAINT "user_privilege_sub_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privileges" ADD CONSTRAINT "user_privileges_user_group_id_fk_user_groups_id_fk" FOREIGN KEY ("user_group_id_fk") REFERENCES "public"."user_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privileges" ADD CONSTRAINT "user_privileges_user_status_id_fk_user_statuses_id_fk" FOREIGN KEY ("user_status_id_fk") REFERENCES "public"."user_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_staff_depatment_mapping" ADD CONSTRAINT "user_staff_depatment_mapping_staff_id_fk_staffs_id_fk" FOREIGN KEY ("staff_id_fk") REFERENCES "public"."staffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_staff_depatment_mapping" ADD CONSTRAINT "user_staff_depatment_mapping_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_reasons" ADD CONSTRAINT "user_status_reasons_user_status_id_fk_user_statuses_id_fk" FOREIGN KEY ("user_status_id_fk") REFERENCES "public"."user_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_session_mapping" ADD CONSTRAINT "user_status_session_mapping_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_session_mapping" ADD CONSTRAINT "user_status_session_mapping_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_session_mapping" ADD CONSTRAINT "user_status_session_mapping_user_status_reason_id_fk_user_status_reasons_id_fk" FOREIGN KEY ("user_status_reason_id_fk") REFERENCES "public"."user_status_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_session_mapping" ADD CONSTRAINT "user_status_session_mapping_by_user_id_fk_users_id_fk" FOREIGN KEY ("by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_department_id_fk_departments_id_fk" FOREIGN KEY ("parent_department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."user_status_master_frequency_type";--> statement-breakpoint
DROP TYPE "public"."user_status_master_level_type";--> statement-breakpoint
DROP TYPE "public"."user_status_master_type";