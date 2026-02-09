CREATE TABLE "user_status_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_status_master_id_fk" integer NOT NULL,
	"user_id_fk" integer NOT NULL,
	"staff_id_fk" integer,
	"student_id_fk" integer,
	"promotion_id_fk" integer,
	"suspended_reason" varchar(255),
	"suspended_till_date" timestamp with time zone,
	"remarks" varchar(255),
	"by_user_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_statuses_master_domain" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_status_master_id_fk" integer NOT NULL,
	"domain" "user_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_status_master_frequency" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_status_master_id_fk" integer NOT NULL,
	"frequency" "user_status_master_frequency_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_status_master_level" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_status_master_id_fk" integer NOT NULL,
	"level" "user_status_master_level_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_statuses_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "user_status_master_type" NOT NULL,
	"tag" varchar(255) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"remarks" varchar(255),
	"coexistence" varchar(2000),
	"enrollment_status" varchar(255) NOT NULL,
	"is_academic_records_accessible" boolean DEFAULT false NOT NULL,
	"has_fee_payment_eligibility" boolean DEFAULT false NOT NULL,
	"is_form_fillup_inclusive" boolean DEFAULT false NOT NULL,
	"is_exam_inclusive" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_statuses_master_tag_unique" UNIQUE("tag"),
	CONSTRAINT "user_statuses_master_enrollmentStatus_unique" UNIQUE("enrollment_status")
);
--> statement-breakpoint
ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_user_status_master_id_fk_user_statuses_master_id_fk" FOREIGN KEY ("user_status_master_id_fk") REFERENCES "public"."user_statuses_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_staff_id_fk_staffs_id_fk" FOREIGN KEY ("staff_id_fk") REFERENCES "public"."staffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_promotion_id_fk_promotions_id_fk" FOREIGN KEY ("promotion_id_fk") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_mapping" ADD CONSTRAINT "user_status_mapping_by_user_id_fk_users_id_fk" FOREIGN KEY ("by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_statuses_master_domain" ADD CONSTRAINT "user_statuses_master_domain_user_status_master_id_fk_user_statuses_master_id_fk" FOREIGN KEY ("user_status_master_id_fk") REFERENCES "public"."user_statuses_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_master_frequency" ADD CONSTRAINT "user_status_master_frequency_user_status_master_id_fk_user_statuses_master_id_fk" FOREIGN KEY ("user_status_master_id_fk") REFERENCES "public"."user_statuses_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status_master_level" ADD CONSTRAINT "user_status_master_level_user_status_master_id_fk_user_statuses_master_id_fk" FOREIGN KEY ("user_status_master_id_fk") REFERENCES "public"."user_statuses_master"("id") ON DELETE no action ON UPDATE no action;