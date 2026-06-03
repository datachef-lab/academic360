CREATE TABLE "fee_group_promotion_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"fee_group_id_fk" integer NOT NULL,
	"promotion_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id_fk" integer NOT NULL,
	"updated_by_user_id_fk" integer NOT NULL,
	CONSTRAINT "fee_group_promotion_mappings_fee_group_id_fk_promotion_id_fk_unique" UNIQUE("fee_group_id_fk","promotion_id_fk")
);
--> statement-breakpoint
CREATE TABLE "fee_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"fee_category_id_fk" integer NOT NULL,
	"fee_slab_id_fk" integer NOT NULL,
	"description" varchar(500) NOT NULL,
	"validity_type" "fee_category_type" DEFAULT 'SEMESTER' NOT NULL,
	"is_carry_forwarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id_fk" integer NOT NULL,
	"updated_by_user_id_fk" integer NOT NULL,
	CONSTRAINT "fee_groups_fee_category_id_fk_fee_slab_id_fk_validityType_unique" UNIQUE("fee_category_id_fk","fee_slab_id_fk","validity_type")
);
--> statement-breakpoint
CREATE TABLE "fee_slabs" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_fee_slab_id" integer,
	"name" varchar(255) NOT NULL,
	"description" varchar(500) NOT NULL,
	"default_rate" double precision DEFAULT 0,
	"sequence" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id_fk" integer NOT NULL,
	"updated_by_user_id_fk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_structure_slabs" (
	"id" serial PRIMARY KEY NOT NULL,
	"fee_structure_id_fk" integer NOT NULL,
	"fee_slab_id_fk" integer NOT NULL,
	"concession_rate" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fee_category_promotion_mappings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fee_structure_concession_slabs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fee_concession_slabs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "fee_category_promotion_mappings" CASCADE;--> statement-breakpoint
DROP TABLE "fee_structure_concession_slabs" CASCADE;--> statement-breakpoint
DROP TABLE "fee_concession_slabs" CASCADE;--> statement-breakpoint
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_categories_priority_unique') THEN
    ALTER TABLE "fee_categories" DROP CONSTRAINT "fee_categories_priority_unique";
  END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_categories_fee_concession_slab_id_fk_name_validityType_unique') THEN
    ALTER TABLE "fee_categories" DROP CONSTRAINT "fee_categories_fee_concession_slab_id_fk_name_validityType_unique";
  END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_categories_fee_concession_slab_id_fk_fee_concession_slabs_id_fk') THEN
    ALTER TABLE "fee_categories" DROP CONSTRAINT "fee_categories_fee_concession_slab_id_fk_fee_concession_slabs_id_fk";
  END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_student_mappings_fee_category_promotion_mapping_id_fk_fee_category_promotion_mappings_id_fk') THEN
    ALTER TABLE "fee_student_mappings" DROP CONSTRAINT "fee_student_mappings_fee_category_promotion_mapping_id_fk_fee_category_promotion_mappings_id_fk";
  END IF;
END $$;--> statement-breakpoint
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_student_mappings_fee_concession_slab_id_fk_fee_concession_slabs_id_fk') THEN
    ALTER TABLE "fee_student_mappings" DROP CONSTRAINT "fee_student_mappings_fee_concession_slab_id_fk_fee_concession_slabs_id_fk";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD COLUMN "fee_group_promotion_mapping_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD COLUMN "fee_slab_id_fk" integer;--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" ADD CONSTRAINT "fee_group_promotion_mappings_fee_group_id_fk_fee_groups_id_fk" FOREIGN KEY ("fee_group_id_fk") REFERENCES "public"."fee_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" ADD CONSTRAINT "fee_group_promotion_mappings_promotion_id_fk_promotions_id_fk" FOREIGN KEY ("promotion_id_fk") REFERENCES "public"."promotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" ADD CONSTRAINT "fee_group_promotion_mappings_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" ADD CONSTRAINT "fee_group_promotion_mappings_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_groups" ADD CONSTRAINT "fee_groups_fee_category_id_fk_fee_categories_id_fk" FOREIGN KEY ("fee_category_id_fk") REFERENCES "public"."fee_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_groups" ADD CONSTRAINT "fee_groups_fee_slab_id_fk_fee_slabs_id_fk" FOREIGN KEY ("fee_slab_id_fk") REFERENCES "public"."fee_slabs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_groups" ADD CONSTRAINT "fee_groups_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_groups" ADD CONSTRAINT "fee_groups_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_slabs" ADD CONSTRAINT "fee_slabs_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_slabs" ADD CONSTRAINT "fee_slabs_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structure_slabs" ADD CONSTRAINT "fee_structure_slabs_fee_structure_id_fk_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id_fk") REFERENCES "public"."fee_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structure_slabs" ADD CONSTRAINT "fee_structure_slabs_fee_slab_id_fk_fee_slabs_id_fk" FOREIGN KEY ("fee_slab_id_fk") REFERENCES "public"."fee_slabs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_fee_group_promotion_mapping_id_fk_fee_group_promotion_mappings_id_fk" FOREIGN KEY ("fee_group_promotion_mapping_id_fk") REFERENCES "public"."fee_group_promotion_mappings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_student_mappings" ADD CONSTRAINT "fee_student_mappings_fee_slab_id_fk_fee_slabs_id_fk" FOREIGN KEY ("fee_slab_id_fk") REFERENCES "public"."fee_slabs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_categories" DROP COLUMN "fee_concession_slab_id_fk";--> statement-breakpoint
ALTER TABLE "fee_categories" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "fee_categories" DROP COLUMN "validity_type";--> statement-breakpoint
ALTER TABLE "fee_categories" DROP COLUMN "is_carry_forwarded";--> statement-breakpoint
ALTER TABLE "fee_student_mappings" DROP COLUMN "fee_category_promotion_mapping_id_fk";--> statement-breakpoint
ALTER TABLE "fee_student_mappings" DROP COLUMN "fee_concession_slab_id_fk";--> statement-breakpoint
ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_name_unique" UNIQUE("name");