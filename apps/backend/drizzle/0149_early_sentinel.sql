ALTER TYPE "public"."payment_for_type" ADD VALUE 'LIBRARY_FINE' BEFORE 'OTHER';--> statement-breakpoint
CREATE TABLE "library_academic_archives" (
	"id" serial PRIMARY KEY NOT NULL,
	"archive_type" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" varchar(2000),
	"program_course_id_fk" integer,
	"class_id_fk" integer,
	"year" integer,
	"file_key" varchar(1000) NOT NULL,
	"mime_type" varchar(255),
	"file_size_bytes" integer,
	"tags" varchar(1000),
	"uploaded_by_user_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_branch_id" integer,
	"name" varchar(500) NOT NULL,
	"code" varchar(100),
	"opening_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"remarks" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_circulation_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"patron_category_id_fk" integer NOT NULL,
	"item_category_id_fk" integer NOT NULL,
	"loan_days" integer DEFAULT 7 NOT NULL,
	"fine_per_day" double precision DEFAULT 0 NOT NULL,
	"renewal_limit" integer DEFAULT 0 NOT NULL,
	"grace_days" integer DEFAULT 0 NOT NULL,
	"max_copies_at_once" integer DEFAULT 1 NOT NULL,
	"skip_holidays_in_fine" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "library_circulation_policies_patron_category_id_fk_item_category_id_fk_unique" UNIQUE("patron_category_id_fk","item_category_id_fk")
);
--> statement-breakpoint
CREATE TABLE "library_evidence_docs" (
	"id" serial PRIMARY KEY NOT NULL,
	"criterion_code" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" varchar(2000),
	"file_key" varchar(1000) NOT NULL,
	"mime_type" varchar(255),
	"file_size_bytes" integer,
	"tags" varchar(1000),
	"academic_year" varchar(50),
	"uploaded_by_user_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_item_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_item_category_id" integer,
	"name" varchar(255) NOT NULL,
	"code" varchar(100),
	"description" varchar(1000),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_journal_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_journal_issue_id" integer,
	"subscription_id_fk" integer NOT NULL,
	"issue_number" varchar(255) NOT NULL,
	"expected_date" date NOT NULL,
	"received_date" date,
	"condition" varchar(255),
	"remarks" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_journal_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_journal_subscription_id" integer,
	"journal_id_fk" integer NOT NULL,
	"vendor_id_fk" integer,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"frequency" varchar(100),
	"cost_per_year" double precision DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"remarks" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_gate_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id_fk" integer,
	"gate_identifier" varchar(255),
	"event_type" varchar(100) NOT NULL,
	"rfid_number" varchar(255),
	"copy_details_id_fk" integer,
	"user_id_fk" integer,
	"captured_image_url" varchar(1000),
	"remarks" varchar(1000),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id_fk" integer,
	"name" varchar(255) NOT NULL,
	"code" varchar(100),
	"description" varchar(1000),
	"capacity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_patron_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_patron_category_id" integer,
	"name" varchar(255) NOT NULL,
	"code" varchar(100),
	"description" varchar(1000),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_reading_list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"reading_list_id_fk" integer NOT NULL,
	"item_type" varchar(50) NOT NULL,
	"book_id_fk" integer,
	"journal_id_fk" integer,
	"external_url" varchar(2000),
	"external_title" varchar(500),
	"notes" varchar(1000),
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_reading_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"class_id_fk" integer,
	"faculty_user_id_fk" integer,
	"title" varchar(500) NOT NULL,
	"description" varchar(2000),
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_student_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id_fk" integer NOT NULL,
	"academic_year" varchar(50) NOT NULL,
	"total_issues" integer DEFAULT 0 NOT NULL,
	"total_returns" integer DEFAULT 0 NOT NULL,
	"total_overdue" integer DEFAULT 0 NOT NULL,
	"total_fines_paid" double precision DEFAULT 0 NOT NULL,
	"library_visits" integer DEFAULT 0 NOT NULL,
	"average_grade" double precision,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_circulation" ADD COLUMN "branch_id_fk" integer;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "branch_id_fk" integer;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "cdl_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "cdl_concurrent_limit" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "cdl_loan_hours" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "copy_details" ADD COLUMN "branch_id_fk" integer;--> statement-breakpoint
ALTER TABLE "copy_details" ADD COLUMN "item_category_id_fk" integer;--> statement-breakpoint
ALTER TABLE "copy_details" ADD COLUMN "rfid_number" varchar(255);--> statement-breakpoint
ALTER TABLE "copy_details" ADD COLUMN "theft_bit_armed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "library_entry_exit" ADD COLUMN "branch_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "library_branch_id_fk" integer;--> statement-breakpoint
ALTER TABLE "library_academic_archives" ADD CONSTRAINT "library_academic_archives_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_academic_archives" ADD CONSTRAINT "library_academic_archives_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_academic_archives" ADD CONSTRAINT "library_academic_archives_uploaded_by_user_id_fk_users_id_fk" FOREIGN KEY ("uploaded_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_circulation_policies" ADD CONSTRAINT "library_circulation_policies_patron_category_id_fk_library_patron_categories_id_fk" FOREIGN KEY ("patron_category_id_fk") REFERENCES "public"."library_patron_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_circulation_policies" ADD CONSTRAINT "library_circulation_policies_item_category_id_fk_library_item_categories_id_fk" FOREIGN KEY ("item_category_id_fk") REFERENCES "public"."library_item_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_evidence_docs" ADD CONSTRAINT "library_evidence_docs_uploaded_by_user_id_fk_users_id_fk" FOREIGN KEY ("uploaded_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_journal_issues" ADD CONSTRAINT "library_journal_issues_subscription_id_fk_library_journal_subscriptions_id_fk" FOREIGN KEY ("subscription_id_fk") REFERENCES "public"."library_journal_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_journal_subscriptions" ADD CONSTRAINT "library_journal_subscriptions_journal_id_fk_journals_id_fk" FOREIGN KEY ("journal_id_fk") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_journal_subscriptions" ADD CONSTRAINT "library_journal_subscriptions_vendor_id_fk_vendors_id_fk" FOREIGN KEY ("vendor_id_fk") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_gate_events" ADD CONSTRAINT "library_gate_events_branch_id_fk_library_branches_id_fk" FOREIGN KEY ("branch_id_fk") REFERENCES "public"."library_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_gate_events" ADD CONSTRAINT "library_gate_events_copy_details_id_fk_copy_details_id_fk" FOREIGN KEY ("copy_details_id_fk") REFERENCES "public"."copy_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_gate_events" ADD CONSTRAINT "library_gate_events_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_zones" ADD CONSTRAINT "library_zones_branch_id_fk_library_branches_id_fk" FOREIGN KEY ("branch_id_fk") REFERENCES "public"."library_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reading_list_items" ADD CONSTRAINT "library_reading_list_items_reading_list_id_fk_library_reading_lists_id_fk" FOREIGN KEY ("reading_list_id_fk") REFERENCES "public"."library_reading_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reading_list_items" ADD CONSTRAINT "library_reading_list_items_book_id_fk_books_id_fk" FOREIGN KEY ("book_id_fk") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reading_list_items" ADD CONSTRAINT "library_reading_list_items_journal_id_fk_journals_id_fk" FOREIGN KEY ("journal_id_fk") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reading_lists" ADD CONSTRAINT "library_reading_lists_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reading_lists" ADD CONSTRAINT "library_reading_lists_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reading_lists" ADD CONSTRAINT "library_reading_lists_faculty_user_id_fk_users_id_fk" FOREIGN KEY ("faculty_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_student_analytics" ADD CONSTRAINT "library_student_analytics_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_circulation" ADD CONSTRAINT "book_circulation_branch_id_fk_library_branches_id_fk" FOREIGN KEY ("branch_id_fk") REFERENCES "public"."library_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_branch_id_fk_library_branches_id_fk" FOREIGN KEY ("branch_id_fk") REFERENCES "public"."library_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_branch_id_fk_library_branches_id_fk" FOREIGN KEY ("branch_id_fk") REFERENCES "public"."library_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_item_category_id_fk_library_item_categories_id_fk" FOREIGN KEY ("item_category_id_fk") REFERENCES "public"."library_item_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_entry_exit" ADD CONSTRAINT "library_entry_exit_branch_id_fk_library_branches_id_fk" FOREIGN KEY ("branch_id_fk") REFERENCES "public"."library_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_library_branch_id_fk_library_branches_id_fk" FOREIGN KEY ("library_branch_id_fk") REFERENCES "public"."library_branches"("id") ON DELETE no action ON UPDATE no action;