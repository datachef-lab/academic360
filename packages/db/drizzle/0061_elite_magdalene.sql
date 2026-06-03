CREATE TABLE "sub_departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id_fk" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sub_departments" ADD CONSTRAINT "sub_departments_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;