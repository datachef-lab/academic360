CREATE TYPE "public"."fee_category_type" AS ENUM('SEMESTER', 'ACADEMIC_YEAR', 'PROGRAM_COURSE');--> statement-breakpoint
CREATE TABLE "fee_category_promotion_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"fee_category_id_fk" integer NOT NULL,
	"promotion_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"fee_concession_slab_id_fk" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500) NOT NULL,
	"priority" integer NOT NULL,
	"validity_type" "fee_category_type" DEFAULT 'SEMESTER' NOT NULL,
	"is_carry_forwarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fee_categories_priority_unique" UNIQUE("priority"),
	CONSTRAINT "fee_categories_fee_concession_slab_id_fk_name_validityType_unique" UNIQUE("fee_concession_slab_id_fk","name","validity_type")
);
--> statement-breakpoint
CREATE TABLE "fee_student_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id_fk" integer NOT NULL,
	"fee_structure_id_fk" integer NOT NULL,
	"fee_category_promotion_mapping_id_fk" integer NOT NULL,
	"type" "student_fee_mapping_type" DEFAULT 'FULL' NOT NULL,
	"fee_structure_installment_id_fk" integer,
	"fee_concession_slab_id_fk" integer,
	"is_waived_off" boolean DEFAULT false NOT NULL,
	"waived_off_amount" integer DEFAULT 0 NOT NULL,
	"waived_off_reason" varchar(500),
	"waived_off_date" timestamp with time zone,
	"waived_off_by_user_id_fk" integer,
	"late_fee" integer DEFAULT 0 NOT NULL,
	"total_payable" integer DEFAULT 0 NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"payment_mode" "payment_mode",
	"transaction_ref" text,
	"transaction_date" timestamp with time zone,
	"receipt_number" varchar(2555),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_fees" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "student_fees" CASCADE;--> statement-breakpoint
ALTER TABLE "addons" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "addons" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structure_components" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structure_components" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_heads" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_heads" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "receipt_types" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "receipt_types" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structure_concession_slabs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structure_concession_slabs" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_concession_slabs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_concession_slabs" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structures" ALTER COLUMN "start_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structures" ALTER COLUMN "end_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structures" ALTER COLUMN "online_start_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structures" ALTER COLUMN "online_end_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structures" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structures" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structure_installments" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structure_installments" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_category_promotion_mappings" ADD CONSTRAINT "fee_category_promotion_mappings_fee_category_id_fk_fee_categories_id_fk" FOREIGN KEY ("fee_category_id_fk") REFERENCES "public"."fee_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_category_promotion_mappings" ADD CONSTRAINT "fee_category_promotion_mappings_promotion_id_fk_promotions_id_fk" FOREIGN KEY ("promotion_id_fk") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_fee_concession_slab_id_fk_fee_concession_slabs_id_fk" FOREIGN KEY ("fee_concession_slab_id_fk") REFERENCES "public"."fee_concession_slabs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_fee_structure_id_fk_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id_fk") REFERENCES "public"."fee_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_fee_category_promotion_mapping_id_fk_fee_category_promotion_mappings_id_fk" FOREIGN KEY ("fee_category_promotion_mapping_id_fk") REFERENCES "public"."fee_category_promotion_mappings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_fee_structure_installment_id_fk_fee_structure_installments_id_fk" FOREIGN KEY ("fee_structure_installment_id_fk") REFERENCES "public"."fee_structure_installments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_fee_concession_slab_id_fk_fee_concession_slabs_id_fk" FOREIGN KEY ("fee_concession_slab_id_fk") REFERENCES "public"."fee_concession_slabs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_waived_off_by_user_id_fk_users_id_fk" FOREIGN KEY ("waived_off_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;