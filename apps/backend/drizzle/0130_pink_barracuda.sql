CREATE TYPE "public"."library_entry_exit_status" AS ENUM('CHECKED_IN', 'CHECKED_OUT');--> statement-breakpoint
CREATE TABLE "binding_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_binding_id" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_circulation" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_book_circulation_id" integer,
	"copy_details_id_fk" integer NOT NULL,
	"user_id_fk" integer NOT NULL,
	"borrowing_type_id_fk" integer,
	"issue_timestamp" timestamp with time zone NOT NULL,
	"return_timestamp" timestamp with time zone NOT NULL,
	"actual_return_timestamp" timestamp with time zone,
	"is_returned" boolean DEFAULT false NOT NULL,
	"is_re_issued" boolean DEFAULT false NOT NULL,
	"is_forced_issue" boolean DEFAULT false NOT NULL,
	"remarks" varchar,
	"fine_amount" double precision DEFAULT 0 NOT NULL,
	"fine_waiver" double precision DEFAULT 0 NOT NULL,
	"fine_waived_by_user_id_fk" integer,
	"fine_waived_at" timestamp with time zone,
	"fine_remarks" varchar,
	"fine_date" timestamp with time zone,
	"payment_id_fk" integer,
	"issued_from_user_id_fk" integer NOT NULL,
	"returned_to_user_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_reissue" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_circulation_id_fk" integer,
	"reissued_by_user_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_books_id" integer,
	"library_document_type_id_fk" integer,
	"title" varchar(1000) NOT NULL,
	"sub_title" varchar(1000),
	"alternate_title" varchar(1000),
	"subject_group_id_fk" integer,
	"language_id_fk" integer,
	"isbn" varchar(1000),
	"issue_date" date,
	"edition" varchar(255),
	"edition_year" varchar(255),
	"book_volume" varchar(255),
	"book_part" varchar(255),
	"series_id_fk" integer,
	"publisher_id_fk" integer,
	"published_year" varchar(255),
	"keywords" varchar(1000),
	"remarks" varchar(1000),
	"call_number" varchar(255),
	"journal_id_fk" integer,
	"issue_number" varchar(255),
	"is_unique_access" boolean DEFAULT false NOT NULL,
	"enclosure_id_fk" integer,
	"notes" varchar(1000),
	"issue_date1" date,
	"issue_date2" date,
	"month_from_at1" varchar(255),
	"month_from_at2" varchar(255),
	"front_cover" varchar,
	"back_cover" varchar,
	"soft_copy" varchar,
	"library_period_id_fk" integer,
	"reference_number" varchar(255),
	"created_by_user_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by_user_id_fk" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "borrowing_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_borrowing_type_id" integer,
	"name" varchar(1000) NOT NULL,
	"search_guideline" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copy_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_copy_details_id" integer,
	"book_id_fk" integer NOT NULL,
	"published_year" varchar(255),
	"access_number" varchar(255),
	"old_access_number" varchar(255),
	"type" varchar(255),
	"issue_type" varchar(255),
	"status_id_fk" integer,
	"entry_mode_id_fk" integer,
	"rack_id_fk" integer,
	"shelf_id_fk" integer,
	"voucher_number" varchar(255),
	"enclosure_id_fk" integer,
	"number_of_enclosures" integer DEFAULT 0,
	"number_of_pages" integer DEFAULT 0,
	"price_in_inr" varchar(255),
	"price_foreign_currency" varchar(255),
	"purchase_price" varchar(255),
	"set_price" varchar(255),
	"binding_type_id_fk" integer,
	"isbn" varchar(255),
	"book_volume" varchar(255),
	"book_part" varchar(255),
	"book_part_info" varchar(255),
	"volume_info" varchar(255),
	"remarks" varchar(1000),
	"legacy_vendor_id" integer,
	"donor_person_id_fk" integer,
	"prefix" varchar(255),
	"suffix" varchar(255),
	"pdf_path" varchar,
	"book_size" varchar(255),
	"bill_date" timestamp with time zone,
	"discount" varchar(255),
	"shipping_charges" varchar(255),
	"created_by_user_id_fk" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by_user_id_fk" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enclosures" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_enclosure_id" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_modes" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_entry_mode_id" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_journal_type_id" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journals" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_journal_id" integer,
	"journal_type_id_fk" integer,
	"subject_group_id_fk" integer,
	"title" varchar(1000) NOT NULL,
	"entry_mode_id_fk" integer,
	"publisher_id_fk" integer,
	"language_id_fk" integer,
	"binding_id_fk" integer,
	"period_id_fk" integer,
	"issn_number" varchar(1000),
	"size_in_cm" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_library_article_id" integer,
	"name" varchar(1000) NOT NULL,
	"code" varchar(500),
	"is_document_type_exist" boolean DEFAULT false NOT NULL,
	"is_unique_access_number" boolean DEFAULT false NOT NULL,
	"is_journal" boolean DEFAULT false NOT NULL,
	"is_author" boolean DEFAULT false NOT NULL,
	"is_imprint" boolean DEFAULT false NOT NULL,
	"is_copy_detail" boolean DEFAULT false NOT NULL,
	"is_keyword" boolean DEFAULT false NOT NULL,
	"is_remarks" boolean DEFAULT false NOT NULL,
	"is_call_number" boolean DEFAULT false NOT NULL,
	"is_enclosure" boolean DEFAULT false NOT NULL,
	"is_voucher" boolean DEFAULT false NOT NULL,
	"is_analytical" boolean DEFAULT false NOT NULL,
	"is_call_number_auto" boolean DEFAULT false NOT NULL,
	"is_call_number_compulsory" boolean DEFAULT false NOT NULL,
	"is_publisher" boolean DEFAULT false NOT NULL,
	"is_note" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_document_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_library_document_type_id" integer,
	"library_article_id_fk" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_entry_exit" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_library_entry_exit_id" integer,
	"user_id_fk" integer NOT NULL,
	"current_status" "library_entry_exit_status" NOT NULL,
	"entry_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"exit_timestamp" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "library_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_library_period_id" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_publisher_id" integer,
	"name" varchar(1000) NOT NULL,
	"code" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "racks" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_rack_id" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_series_id" integer,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "series_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "shelfs" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_shelf_id" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_status_id" integer,
	"name" varchar(1000) NOT NULL,
	"is_issuable" boolean DEFAULT false NOT NULL,
	"issued_to" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subject_grouping_main" ALTER COLUMN "subject_type_id_fk" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subject_grouping_main" ADD COLUMN "legacy_subject_group_id" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN "publisher_id_fk" integer;--> statement-breakpoint
ALTER TABLE "book_circulation" ADD CONSTRAINT "book_circulation_copy_details_id_fk_copy_details_id_fk" FOREIGN KEY ("copy_details_id_fk") REFERENCES "public"."copy_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_circulation" ADD CONSTRAINT "book_circulation_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_circulation" ADD CONSTRAINT "book_circulation_borrowing_type_id_fk_borrowing_types_id_fk" FOREIGN KEY ("borrowing_type_id_fk") REFERENCES "public"."borrowing_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_circulation" ADD CONSTRAINT "book_circulation_fine_waived_by_user_id_fk_users_id_fk" FOREIGN KEY ("fine_waived_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_circulation" ADD CONSTRAINT "book_circulation_payment_id_fk_payments_id_fk" FOREIGN KEY ("payment_id_fk") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_circulation" ADD CONSTRAINT "book_circulation_issued_from_user_id_fk_users_id_fk" FOREIGN KEY ("issued_from_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_circulation" ADD CONSTRAINT "book_circulation_returned_to_user_id_fk_users_id_fk" FOREIGN KEY ("returned_to_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reissue" ADD CONSTRAINT "book_reissue_book_circulation_id_fk_book_circulation_id_fk" FOREIGN KEY ("book_circulation_id_fk") REFERENCES "public"."book_circulation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reissue" ADD CONSTRAINT "book_reissue_reissued_by_user_id_fk_users_id_fk" FOREIGN KEY ("reissued_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_library_document_type_id_fk_library_document_types_id_fk" FOREIGN KEY ("library_document_type_id_fk") REFERENCES "public"."library_document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_subject_group_id_fk_subject_grouping_main_id_fk" FOREIGN KEY ("subject_group_id_fk") REFERENCES "public"."subject_grouping_main"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_language_id_fk_language_medium_id_fk" FOREIGN KEY ("language_id_fk") REFERENCES "public"."language_medium"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_series_id_fk_series_id_fk" FOREIGN KEY ("series_id_fk") REFERENCES "public"."series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_publisher_id_fk_publishers_id_fk" FOREIGN KEY ("publisher_id_fk") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_journal_id_fk_journals_id_fk" FOREIGN KEY ("journal_id_fk") REFERENCES "public"."journals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_enclosure_id_fk_enclosures_id_fk" FOREIGN KEY ("enclosure_id_fk") REFERENCES "public"."enclosures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_library_period_id_fk_library_periods_id_fk" FOREIGN KEY ("library_period_id_fk") REFERENCES "public"."library_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_book_id_fk_books_id_fk" FOREIGN KEY ("book_id_fk") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_status_id_fk_library_statuses_id_fk" FOREIGN KEY ("status_id_fk") REFERENCES "public"."library_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_entry_mode_id_fk_entry_modes_id_fk" FOREIGN KEY ("entry_mode_id_fk") REFERENCES "public"."entry_modes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_rack_id_fk_racks_id_fk" FOREIGN KEY ("rack_id_fk") REFERENCES "public"."racks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_shelf_id_fk_shelfs_id_fk" FOREIGN KEY ("shelf_id_fk") REFERENCES "public"."shelfs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_enclosure_id_fk_enclosures_id_fk" FOREIGN KEY ("enclosure_id_fk") REFERENCES "public"."enclosures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_binding_type_id_fk_binding_types_id_fk" FOREIGN KEY ("binding_type_id_fk") REFERENCES "public"."binding_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_donor_person_id_fk_person_id_fk" FOREIGN KEY ("donor_person_id_fk") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journals" ADD CONSTRAINT "journals_journal_type_id_fk_journal_types_id_fk" FOREIGN KEY ("journal_type_id_fk") REFERENCES "public"."journal_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journals" ADD CONSTRAINT "journals_subject_group_id_fk_subject_grouping_main_id_fk" FOREIGN KEY ("subject_group_id_fk") REFERENCES "public"."subject_grouping_main"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journals" ADD CONSTRAINT "journals_entry_mode_id_fk_entry_modes_id_fk" FOREIGN KEY ("entry_mode_id_fk") REFERENCES "public"."entry_modes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journals" ADD CONSTRAINT "journals_publisher_id_fk_publishers_id_fk" FOREIGN KEY ("publisher_id_fk") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journals" ADD CONSTRAINT "journals_language_id_fk_language_medium_id_fk" FOREIGN KEY ("language_id_fk") REFERENCES "public"."language_medium"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journals" ADD CONSTRAINT "journals_binding_id_fk_binding_types_id_fk" FOREIGN KEY ("binding_id_fk") REFERENCES "public"."binding_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journals" ADD CONSTRAINT "journals_period_id_fk_library_periods_id_fk" FOREIGN KEY ("period_id_fk") REFERENCES "public"."library_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_document_types" ADD CONSTRAINT "library_document_types_library_article_id_fk_library_articles_id_fk" FOREIGN KEY ("library_article_id_fk") REFERENCES "public"."library_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_entry_exit" ADD CONSTRAINT "library_entry_exit_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_publisher_id_fk_publishers_id_fk" FOREIGN KEY ("publisher_id_fk") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;