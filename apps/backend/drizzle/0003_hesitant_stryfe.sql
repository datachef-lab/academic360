CREATE TYPE "public"."notice_status" AS ENUM('ACTIVE', 'EXPIRED', 'SCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."notice_variant" AS ENUM('EXAM', 'ALERT', 'FEE', 'EVENT');--> statement-breakpoint
ALTER TYPE "public"."study_material_type" RENAME TO "attachment_type";--> statement-breakpoint
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
ALTER TABLE "notice_attachments" ADD CONSTRAINT "notice_attachments_notice_id_fk_notices_id_fk" FOREIGN KEY ("notice_id_fk") REFERENCES "public"."notices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;