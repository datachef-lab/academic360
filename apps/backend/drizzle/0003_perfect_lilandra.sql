CREATE TABLE "blood_group" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(5) NOT NULL,
	CONSTRAINT "blood_group_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"document_required" boolean DEFAULT false NOT NULL,
	"code" varchar(10) NOT NULL,
	CONSTRAINT "categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"document_required" boolean DEFAULT false NOT NULL,
	"code" varchar(10) NOT NULL,
	CONSTRAINT "cities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer
);
--> statement-breakpoint
CREATE TABLE "nationality" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	"code" integer,
	CONSTRAINT "nationality_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "religion" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"sequence" integer,
	CONSTRAINT "religion_name_unique" UNIQUE("name"),
	CONSTRAINT "religion_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "states" ADD CONSTRAINT "states_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;