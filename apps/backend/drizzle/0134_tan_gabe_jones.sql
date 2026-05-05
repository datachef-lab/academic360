CREATE TABLE "academic_activity_master" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "academic_activity_type" NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" varchar(1000),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_activities" ADD COLUMN "academic_activity_master_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_activities" ADD CONSTRAINT "academic_activities_academic_activity_master_id_fk_academic_activity_master_id_fk" FOREIGN KEY ("academic_activity_master_id_fk") REFERENCES "public"."academic_activity_master"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_activities" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "academic_activities" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "academic_activities" DROP COLUMN "description";