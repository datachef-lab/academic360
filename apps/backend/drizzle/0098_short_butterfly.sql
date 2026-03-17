CREATE TYPE "public"."app_module_icon_type" AS ENUM('emoji', 'lucide', 'svg', 'url');--> statement-breakpoint
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
ALTER TABLE "department_designation_mapping" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "designations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_group_domains" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_group_designations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_group_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_privilege_sub_program_courses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_privilege_sub_scopes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_privilege_sub" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_privileges" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_staff_designation_mapping" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_status_reasons" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_status_session_mapping" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_statuses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "department_designation_mapping" CASCADE;--> statement-breakpoint
DROP TABLE "designations" CASCADE;--> statement-breakpoint
DROP TABLE "user_group_domains" CASCADE;--> statement-breakpoint
DROP TABLE "user_group_designations" CASCADE;--> statement-breakpoint
DROP TABLE "user_group_members" CASCADE;--> statement-breakpoint
DROP TABLE "user_groups" CASCADE;--> statement-breakpoint
DROP TABLE "user_privilege_sub_program_courses" CASCADE;--> statement-breakpoint
DROP TABLE "user_privilege_sub_scopes" CASCADE;--> statement-breakpoint
DROP TABLE "user_privilege_sub" CASCADE;--> statement-breakpoint
DROP TABLE "user_privileges" CASCADE;--> statement-breakpoint
DROP TABLE "user_staff_designation_mapping" CASCADE;--> statement-breakpoint
DROP TABLE "user_status_reasons" CASCADE;--> statement-breakpoint
DROP TABLE "user_status_session_mapping" CASCADE;--> statement-breakpoint
DROP TABLE "user_statuses" CASCADE;--> statement-breakpoint
ALTER TABLE "departments" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app_modules" ADD COLUMN "icon_type" "app_module_icon_type";--> statement-breakpoint
ALTER TABLE "app_modules" ADD COLUMN "icon_value" varchar(255);--> statement-breakpoint
ALTER TABLE "app_modules" ADD COLUMN "is_read_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_statuses_master" ADD CONSTRAINT "user_statuses_master_parent_user_status_master_id_fk_user_statuses_master_id_fk" FOREIGN KEY ("parent_user_status_master_id_fk") REFERENCES "public"."user_statuses_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_types" DROP COLUMN "is_deletable";