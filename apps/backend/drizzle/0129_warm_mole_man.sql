CREATE TABLE "academic_activity_class_scopes" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_activity_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_activity_program_course_scopes" (
	"id" serial PRIMARY KEY NOT NULL,
	"academic_activity_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" varchar(1000),
	"audience" "academic_activity_audience" DEFAULT 'ALL' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"remarks" varchar(1000),
	"is_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_by_user_id_fk" integer
);
--> statement-breakpoint
ALTER TABLE "academic_activity_class_scopes" ADD CONSTRAINT "academic_activity_class_scopes_academic_activity_id_fk_academic_activities_id_fk" FOREIGN KEY ("academic_activity_id_fk") REFERENCES "public"."academic_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activity_class_scopes" ADD CONSTRAINT "academic_activity_class_scopes_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activity_program_course_scopes" ADD CONSTRAINT "academic_activity_program_course_scopes_academic_activity_id_fk_academic_activities_id_fk" FOREIGN KEY ("academic_activity_id_fk") REFERENCES "public"."academic_activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activity_program_course_scopes" ADD CONSTRAINT "academic_activity_program_course_scopes_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activities" ADD CONSTRAINT "academic_activities_last_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("last_updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;