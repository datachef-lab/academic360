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
--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."app_module_icon_type" AS ENUM('emoji', 'lucide', 'svg', 'url');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_modules" (
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
DROP TABLE IF EXISTS "user_statuses_master" CASCADE;
--> statement-breakpoint
CREATE TABLE "user_statuses_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_user_status_master_id_fk" integer,
	"name" varchar(255) NOT NULL,
	"color" varchar(255),
	"description" varchar(500),
	"code" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_statuses_master_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "department_designation_mapping" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "designations" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_group_domains" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_group_designations" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_group_members" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_groups" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_privilege_sub_program_courses" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_privilege_sub_scopes" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_privilege_sub" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_privileges" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_staff_designation_mapping" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_status_reasons" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_status_session_mapping" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_statuses" DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN null; END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS "department_designation_mapping" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "designations" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_group_domains" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_group_designations" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_group_members" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_groups" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_privilege_sub_program_courses" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_privilege_sub_scopes" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_privilege_sub" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_privileges" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_staff_designation_mapping" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_status_reasons" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_status_session_mapping" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_statuses" CASCADE;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "departments" ALTER COLUMN "is_active" SET NOT NULL; EXCEPTION WHEN undefined_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "app_modules" ADD COLUMN "icon_type" "app_module_icon_type"; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "app_modules" ADD COLUMN "icon_value" varchar(255); EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "app_modules" ADD COLUMN "is_read_only" boolean DEFAULT false NOT NULL; EXCEPTION WHEN duplicate_column THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_statuses_master" ADD CONSTRAINT "user_statuses_master_parent_user_status_master_id_fk_user_statuses_master_id_fk" FOREIGN KEY ("parent_user_status_master_id_fk") REFERENCES "public"."user_statuses_master"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_types" DROP COLUMN "is_deletable"; EXCEPTION WHEN undefined_column THEN null; END $$;