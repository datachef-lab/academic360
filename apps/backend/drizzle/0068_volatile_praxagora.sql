CREATE TYPE "public"."student_fee_mapping_type" AS ENUM('FULL', 'INSTALLMENT');--> statement-breakpoint
CREATE TABLE "fee_structure_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"fee_structure_id_fk" integer NOT NULL,
	"fee_head_id_fk" integer NOT NULL,
	"is_concession_applicable" boolean DEFAULT false NOT NULL,
	"fee_head_percentage" double precision DEFAULT 0 NOT NULL,
	"sequence" integer NOT NULL,
	"remarks" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_heads" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_fee_head_id" integer,
	"name" varchar(255) NOT NULL,
	"default_percentage" double precision DEFAULT 0 NOT NULL,
	"sequence" integer NOT NULL,
	"remarks" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fee_heads_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "receipt_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_receipt_type_id" integer,
	"name" varchar(255) NOT NULL,
	"chk" varchar(255),
	"chk_misc" varchar(255),
	"print_chln" varchar(255),
	"spl_type" varchar(255),
	"add_on_id_fk" integer,
	"print_receipt" varchar(255),
	"chk_online" varchar(255),
	"chk_on_sequence" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_structure_concession_slabs" (
	"id" serial PRIMARY KEY NOT NULL,
	"fees_structure_id_fk" integer NOT NULL,
	"fee_concession_slab_id_fk" integer NOT NULL,
	"concession_rate" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_concession_slabs" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_fee_slab_id" integer,
	"name" varchar(255) NOT NULL,
	"description" varchar(500) NOT NULL,
	"default_concession_rate" double precision DEFAULT 0,
	"sequence" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fee_concession_slabs_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "fee_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_type_id_fk" integer,
	"base_amount" double precision NOT NULL,
	"closing_date" date,
	"academic_year_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"shift_id_fk" integer NOT NULL,
	"advance_for_program_course_id_fk" integer,
	"advance_for_class_id_fk" integer,
	"start_date" timestamp,
	"end_date" timestamp,
	"online_start_date" timestamp,
	"online_end_date" timestamp,
	"number_of_installments" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_structure_installments" (
	"id" serial PRIMARY KEY NOT NULL,
	"fee_structure_id_fk" integer NOT NULL,
	"installment_number" integer NOT NULL,
	"base_amount" double precision DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"online_start_date" timestamp,
	"online_end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"fee_structure_id_fk" integer NOT NULL,
	"type" "student_fee_mapping_type" DEFAULT 'FULL' NOT NULL,
	"fee_structure_installment_id_fk" integer,
	"fee_concession_slab_id_fk" integer,
	"late_fee" integer DEFAULT 0 NOT NULL,
	"total_payable" integer NOT NULL,
	"amount_paid" integer NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"payment_mode" "payment_mode",
	"transaction_ref" varchar(255),
	"transaction_date" timestamp,
	"receipt_number" varchar(2555),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "fees_components" CASCADE;--> statement-breakpoint
DROP TABLE "fees_heads" CASCADE;--> statement-breakpoint
DROP TABLE "fees_receipt_types" CASCADE;--> statement-breakpoint
DROP TABLE "fees_slab_mapping" CASCADE;--> statement-breakpoint
DROP TABLE "fees_slab" CASCADE;--> statement-breakpoint
DROP TABLE "fees_structures" CASCADE;--> statement-breakpoint
DROP TABLE "instalments" CASCADE;--> statement-breakpoint
DROP TABLE "student_fees_mappings" CASCADE;--> statement-breakpoint
ALTER TABLE "fee_structure_components" ADD CONSTRAINT "fee_structure_components_fee_structure_id_fk_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id_fk") REFERENCES "public"."fee_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structure_components" ADD CONSTRAINT "fee_structure_components_fee_head_id_fk_fee_heads_id_fk" FOREIGN KEY ("fee_head_id_fk") REFERENCES "public"."fee_heads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_types" ADD CONSTRAINT "receipt_types_add_on_id_fk_addons_id_fk" FOREIGN KEY ("add_on_id_fk") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structure_concession_slabs" ADD CONSTRAINT "fee_structure_concession_slabs_fees_structure_id_fk_fee_structures_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."fee_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structure_concession_slabs" ADD CONSTRAINT "fee_structure_concession_slabs_fee_concession_slab_id_fk_fee_concession_slabs_id_fk" FOREIGN KEY ("fee_concession_slab_id_fk") REFERENCES "public"."fee_concession_slabs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_receipt_type_id_fk_receipt_types_id_fk" FOREIGN KEY ("receipt_type_id_fk") REFERENCES "public"."receipt_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_shift_id_fk_shifts_id_fk" FOREIGN KEY ("shift_id_fk") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_advance_for_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("advance_for_program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_advance_for_class_id_fk_classes_id_fk" FOREIGN KEY ("advance_for_class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structure_installments" ADD CONSTRAINT "fee_structure_installments_fee_structure_id_fk_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id_fk") REFERENCES "public"."fee_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_fee_structure_id_fk_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id_fk") REFERENCES "public"."fee_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_fee_structure_installment_id_fk_fee_structure_installments_id_fk" FOREIGN KEY ("fee_structure_installment_id_fk") REFERENCES "public"."fee_structure_installments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_fee_concession_slab_id_fk_fee_concession_slabs_id_fk" FOREIGN KEY ("fee_concession_slab_id_fk") REFERENCES "public"."fee_concession_slabs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."student_fees_mapping_type";