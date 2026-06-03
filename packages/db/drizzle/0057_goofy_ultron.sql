CREATE TABLE "designations" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_designation_id" integer,
	"name" varchar(900) NOT NULL,
	"description" varchar(2000),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "designations_name_unique" UNIQUE("name")
);
