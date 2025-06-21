CREATE TYPE "public"."payment_mode" AS ENUM('CASH', 'CHEQUE', 'ONLINE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."student_fees_mapping_type" AS ENUM('FULL', 'INSTALMENT');--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_year" varchar(4) NOT NULL,
	"end_year" varchar(4) NOT NULL,
	"is_current_year" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fees_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"fees_structure_id_fk" integer NOT NULL,
	"fees_head_id_fk" integer NOT NULL,
	"is_concession_applicable" boolean DEFAULT false NOT NULL,
	"amount" double precision NOT NULL,
	"concession_amount" double precision DEFAULT 0 NOT NULL,
	"sequence" integer NOT NULL,
	"remarks" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fees_components_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "fees_heads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer NOT NULL,
	"remarks" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fees_heads_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "fees_receipt_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"chk" varchar(255),
	"chk_misc" varchar(255),
	"print_chln" varchar(255),
	"spl_type" varchar(255),
	"add_on_id" integer,
	"print_receipt" varchar(255),
	"chk_online" varchar(255),
	"chk_on_sequence" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fees_slab" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500) NOT NULL,
	"sequence" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fees_slab_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "fees_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"closing_date" date NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"course_id_fk" integer NOT NULL,
	"semester" integer NOT NULL,
	"advance_for_course_id_fk" integer NOT NULL,
	"advance_for_semester" integer,
	"fees_slab_id_fk" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"online_date_from" date NOT NULL,
	"online_date_to" date NOT NULL,
	"number_of_instalments" integer,
	"instalment_from_date" date NOT NULL,
	"instalment_to_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_fees_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"fees_structure_id_fk" integer NOT NULL,
	"type" "student_fees_mapping_type" DEFAULT 'FULL' NOT NULL,
	"instalment_number" integer,
	"amount_paid" integer,
	"late_fee" integer DEFAULT 0 NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"payment_mode" "payment_mode",
	"transaction_ref" varchar(255),
	"transaction_date" timestamp,
	"receipt_number" varchar(2555),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fees_components" ADD CONSTRAINT "fees_components_fees_structure_id_fk_fees_structures_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."fees_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_components" ADD CONSTRAINT "fees_components_fees_head_id_fk_fees_heads_id_fk" FOREIGN KEY ("fees_head_id_fk") REFERENCES "public"."fees_heads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_receipt_types" ADD CONSTRAINT "fees_receipt_types_add_on_id_addons_id_fk" FOREIGN KEY ("add_on_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_course_id_fk_courses_id_fk" FOREIGN KEY ("course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_advance_for_course_id_fk_courses_id_fk" FOREIGN KEY ("advance_for_course_id_fk") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" ADD CONSTRAINT "fees_structures_fees_slab_id_fk_fees_slab_id_fk" FOREIGN KEY ("fees_slab_id_fk") REFERENCES "public"."fees_slab"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ADD CONSTRAINT "student_fees_mappings_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ADD CONSTRAINT "student_fees_mappings_fees_structure_id_fk_fees_structures_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."fees_structures"("id") ON DELETE no action ON UPDATE no action;