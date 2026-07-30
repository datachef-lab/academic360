CREATE TYPE "public"."document_batch_receipt_mode" AS ENUM('EXAM_LINKED', 'ADMINISTRATIVE');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('EXAM_LINKED', 'ADMINISTRATIVE', 'UPLOAD', 'SYSTEM_GENERATED');--> statement-breakpoint
CREATE TYPE "public"."document_domain" AS ENUM('PRE_ADMISSION', 'POST_ADMISSION', 'ENROLMENT', 'PRE_CU_REGISTRATION', 'POST_CU_REGISTRATION', 'EXAM', 'FEES', 'LIBRARY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."document_eligibility_rule" AS ENUM('FORM_FILLUP_RECORDED', 'RCSI_RECORDED');--> statement-breakpoint
CREATE TYPE "public"."document_ledger_status" AS ENUM('UPLOADED', 'PENDING', 'ON_HOLD', 'COLLECTED', 'WAIVED', 'EXPECTED', 'NO_CHANGE');--> statement-breakpoint
CREATE TYPE "public"."issuing_authority" AS ENUM('UNIVERSITY', 'COLLEGE');--> statement-breakpoint
CREATE TABLE "document_batch_receipt_modes" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_batch_receipt_id_fk" integer NOT NULL,
	"mode" "document_batch_receipt_mode" DEFAULT 'ADMINISTRATIVE' NOT NULL,
	"is_enabled" boolean DEFAULT false,
	"notify_student" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_batch_receipt_mode" UNIQUE("document_batch_receipt_id_fk","mode")
);
--> statement-breakpoint
CREATE TABLE "document_batch_receipt_program_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_batch_receipt_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_batch_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type_id_fk" integer NOT NULL,
	"name" varchar(1000) NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"appear_type_id_fk" integer,
	"expected_arrival_date" timestamp with time zone,
	"available_from_date" timestamp with time zone,
	"created_by_user_id_fk" integer NOT NULL,
	"updated_by_user_id_fk" integer NOT NULL,
	"documents_received_by_user_id_fk" integer,
	"documents_received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type_id_fk" integer NOT NULL,
	"document_batch_receipt_id_fk" integer,
	"promotion_id_fk" integer NOT NULL,
	"is_self_sourced" boolean NOT NULL,
	"status" "document_ledger_status" NOT NULL,
	"link" text,
	"collected_at" timestamp with time zone,
	"provided_by_fk" integer,
	"is_overridden" boolean DEFAULT false,
	"override_reason" varchar(1000),
	"override_by_fk" integer,
	"overridden_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" RENAME TO "document_types";--> statement-breakpoint
ALTER TABLE "document_types" DROP CONSTRAINT "documents_name_unique";--> statement-breakpoint
ALTER TABLE "document_types" DROP CONSTRAINT "documents_sequence_unique";--> statement-breakpoint
ALTER TABLE "cu_registration_document_uploads" DROP CONSTRAINT "cu_registration_document_uploads_document_id_fk_documents_id_fk";
--> statement-breakpoint
ALTER TABLE "document_types" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "document_types" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "domain" "document_domain" DEFAULT 'OTHER' NOT NULL;--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "issuing_authority" "issuing_authority";--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "category" "document_category" DEFAULT 'ADMINISTRATIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "eligibility_rule" "document_eligibility_rule";--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "requires_fee_clearance" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "requires_library_clearance" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "bg_color" varchar(255);--> statement-breakpoint
ALTER TABLE "document_types" ADD COLUMN "text_color" varchar(255);--> statement-breakpoint
ALTER TABLE "document_batch_receipt_modes" ADD CONSTRAINT "document_batch_receipt_modes_document_batch_receipt_id_fk_document_batch_receipts_id_fk" FOREIGN KEY ("document_batch_receipt_id_fk") REFERENCES "public"."document_batch_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_receipt_program_courses" ADD CONSTRAINT "document_batch_receipt_program_courses_document_batch_receipt_id_fk_document_batch_receipts_id_fk" FOREIGN KEY ("document_batch_receipt_id_fk") REFERENCES "public"."document_batch_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_receipt_program_courses" ADD CONSTRAINT "document_batch_receipt_program_courses_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_document_type_id_fk_document_types_id_fk" FOREIGN KEY ("document_type_id_fk") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_appear_type_id_fk_promotion_status_id_fk" FOREIGN KEY ("appear_type_id_fk") REFERENCES "public"."promotion_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_batch_receipts" ADD CONSTRAINT "document_batch_receipts_documents_received_by_user_id_fk_users_id_fk" FOREIGN KEY ("documents_received_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_document_type_id_fk_document_types_id_fk" FOREIGN KEY ("document_type_id_fk") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_document_batch_receipt_id_fk_document_batch_receipts_id_fk" FOREIGN KEY ("document_batch_receipt_id_fk") REFERENCES "public"."document_batch_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_promotion_id_fk_promotions_id_fk" FOREIGN KEY ("promotion_id_fk") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_provided_by_fk_users_id_fk" FOREIGN KEY ("provided_by_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_ledger" ADD CONSTRAINT "document_ledger_override_by_fk_users_id_fk" FOREIGN KEY ("override_by_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cu_registration_document_uploads" ADD CONSTRAINT "cu_registration_document_uploads_document_id_fk_document_types_id_fk" FOREIGN KEY ("document_id_fk") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_sequence_unique" UNIQUE("sequence");