CREATE TABLE "department_designation_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id_fk" integer NOT NULL,
	"designation_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_dept_designation" UNIQUE("department_id_fk","designation_id_fk")
);
--> statement-breakpoint
CREATE TABLE "user_group_designations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_group_id_fk" integer NOT NULL,
	"designation_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_group_designation" UNIQUE("user_group_id_fk","designation_id_fk")
);
--> statement-breakpoint
CREATE TABLE "user_privilege_sub_program_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_privilege_sub_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"is_accessible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_privilege_sub_program_course" UNIQUE("user_privilege_sub_id_fk","program_course_id_fk")
);
--> statement-breakpoint
CREATE TABLE "user_privilege_sub_scopes" (
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
CREATE TABLE "user_staff_designation_mapping" (
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
CREATE TABLE "user_types" (
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
ALTER TABLE "user_staff_depatment_mapping" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_staff_depatment_mapping" CASCADE;--> statement-breakpoint
ALTER TABLE "user_privilege_sub" DROP CONSTRAINT "uq_user_group_app_module_program_course_department";--> statement-breakpoint
ALTER TABLE "user_privilege_sub" DROP CONSTRAINT "user_privilege_sub_program_course_id_fk_program_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "user_privilege_sub" DROP CONSTRAINT "user_privilege_sub_department_id_fk_departments_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_type_id_fk" integer;--> statement-breakpoint
ALTER TABLE "department_designation_mapping" ADD CONSTRAINT "department_designation_mapping_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_designation_mapping" ADD CONSTRAINT "department_designation_mapping_designation_id_fk_designations_id_fk" FOREIGN KEY ("designation_id_fk") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group_designations" ADD CONSTRAINT "user_group_designations_user_group_id_fk_user_groups_id_fk" FOREIGN KEY ("user_group_id_fk") REFERENCES "public"."user_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_group_designations" ADD CONSTRAINT "user_group_designations_designation_id_fk_designations_id_fk" FOREIGN KEY ("designation_id_fk") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub_program_courses" ADD CONSTRAINT "user_privilege_sub_program_courses_user_privilege_sub_id_fk_user_privilege_sub_id_fk" FOREIGN KEY ("user_privilege_sub_id_fk") REFERENCES "public"."user_privilege_sub"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub_program_courses" ADD CONSTRAINT "user_privilege_sub_program_courses_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub_scopes" ADD CONSTRAINT "user_privilege_sub_scopes_user_privilege_sub_id_fk_user_privilege_sub_id_fk" FOREIGN KEY ("user_privilege_sub_id_fk") REFERENCES "public"."user_privilege_sub"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub_scopes" ADD CONSTRAINT "user_privilege_sub_scopes_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub_scopes" ADD CONSTRAINT "user_privilege_sub_scopes_designation_id_fk_designations_id_fk" FOREIGN KEY ("designation_id_fk") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_staff_designation_mapping" ADD CONSTRAINT "user_staff_designation_mapping_staff_id_fk_staffs_id_fk" FOREIGN KEY ("staff_id_fk") REFERENCES "public"."staffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_staff_designation_mapping" ADD CONSTRAINT "user_staff_designation_mapping_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_staff_designation_mapping" ADD CONSTRAINT "user_staff_designation_mapping_designation_id_fk_designations_id_fk" FOREIGN KEY ("designation_id_fk") REFERENCES "public"."designations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_user_type_id_fk_user_types_id_fk" FOREIGN KEY ("user_type_id_fk") REFERENCES "public"."user_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_privilege_sub" DROP COLUMN "program_course_id_fk";--> statement-breakpoint
ALTER TABLE "user_privilege_sub" DROP COLUMN "department_id_fk";--> statement-breakpoint
ALTER TABLE "user_privilege_sub" ADD CONSTRAINT "uq_user_group_app_module_program_course_department" UNIQUE("user_privilege_id_fk","app_module_id_fk");