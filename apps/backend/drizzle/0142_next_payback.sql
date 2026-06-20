CREATE TABLE "author_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_author_details_id" integer,
	"book_id_fk" integer NOT NULL,
	"author_type_id_fk" integer NOT NULL,
	"author_id_fk" integer NOT NULL,
	"remarks" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "author_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_author_type_id" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_author_id" integer,
	"author_type_id_fk" integer,
	"name" varchar(1000) NOT NULL,
	"short_name" varchar(1000),
	"nationality_id_fk" integer,
	"remarks" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_holiday_student_mapping_id" integer,
	"holiday_id_fk" integer NOT NULL,
	"program_course_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"is_holiday" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_holidays_id" integer,
	"name" varchar(1000) NOT NULL,
	"short_name" varchar(1000),
	"from" date NOT NULL,
	"to" date NOT NULL,
	"remarks" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "author_details" ADD CONSTRAINT "author_details_book_id_fk_books_id_fk" FOREIGN KEY ("book_id_fk") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "author_details" ADD CONSTRAINT "author_details_author_type_id_fk_author_types_id_fk" FOREIGN KEY ("author_type_id_fk") REFERENCES "public"."author_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "author_details" ADD CONSTRAINT "author_details_author_id_fk_authors_id_fk" FOREIGN KEY ("author_id_fk") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_author_type_id_fk_author_types_id_fk" FOREIGN KEY ("author_type_id_fk") REFERENCES "public"."author_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_nationality_id_fk_nationality_id_fk" FOREIGN KEY ("nationality_id_fk") REFERENCES "public"."nationality"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_holidays" ADD CONSTRAINT "class_holidays_holiday_id_fk_holidays_id_fk" FOREIGN KEY ("holiday_id_fk") REFERENCES "public"."holidays"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_holidays" ADD CONSTRAINT "class_holidays_program_course_id_fk_program_courses_id_fk" FOREIGN KEY ("program_course_id_fk") REFERENCES "public"."program_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_holidays" ADD CONSTRAINT "class_holidays_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;