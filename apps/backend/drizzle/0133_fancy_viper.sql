CREATE TYPE "public"."academic_activity_type" AS ENUM('FINANCE', 'EXAMINATION', 'ADMISSION', 'ACADEMIC');--> statement-breakpoint
CREATE TABLE "academic_activity_scopes" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_activity_id_fk" integer NOT NULL,
	"stream_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_year_id_fk" integer NOT NULL,
	"type" "academic_activity_type" NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" varchar(1000),
	"audience" "academic_activity_audience" DEFAULT 'ALL' NOT NULL,
	"affiliation_id_fk" integer NOT NULL,
	"regulation_type_id_fk" integer NOT NULL,
	"appear_type_promotion_status_id_fk" integer NOT NULL,
	"remarks" varchar(1000),
	"is_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by_user_id_fk" integer
);
--> statement-breakpoint
ALTER TABLE "academic_activity_scopes" ADD CONSTRAINT "academic_activity_scopes_academic_activity_id_fk_academic_activities_id_fk" FOREIGN KEY ("academic_activity_id_fk") REFERENCES "public"."academic_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activity_scopes" ADD CONSTRAINT "academic_activity_scopes_stream_id_fk_streams_id_fk" FOREIGN KEY ("stream_id_fk") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activity_scopes" ADD CONSTRAINT "academic_activity_scopes_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activities" ADD CONSTRAINT "academic_activities_academic_year_id_fk_academic_years_id_fk" FOREIGN KEY ("academic_year_id_fk") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activities" ADD CONSTRAINT "academic_activities_affiliation_id_fk_affiliations_id_fk" FOREIGN KEY ("affiliation_id_fk") REFERENCES "public"."affiliations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activities" ADD CONSTRAINT "academic_activities_regulation_type_id_fk_regulation_types_id_fk" FOREIGN KEY ("regulation_type_id_fk") REFERENCES "public"."regulation_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activities" ADD CONSTRAINT "academic_activities_appear_type_promotion_status_id_fk_promotion_status_id_fk" FOREIGN KEY ("appear_type_promotion_status_id_fk") REFERENCES "public"."promotion_status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activities" ADD CONSTRAINT "academic_activities_last_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("last_updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;