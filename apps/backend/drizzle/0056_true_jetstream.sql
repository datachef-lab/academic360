CREATE TABLE "exam_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_exam_type_id" integer,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"description" text,
	"carry" varchar(500),
	"is_board_exam" boolean DEFAULT false,
	"passing_marks" double precision DEFAULT 0 NOT NULL,
	"full_marks" double precision DEFAULT 0 NOT NULL,
	"weightage" double precision DEFAULT 0 NOT NULL,
	"written_passing_marks" double precision DEFAULT 0 NOT NULL,
	"written_full_marks" double precision DEFAULT 0 NOT NULL,
	"oral_passing_marks" double precision DEFAULT 0 NOT NULL,
	"oral_full_marks" double precision DEFAULT 0 NOT NULL,
	"review" boolean DEFAULT false,
	"is_formatative_test1" boolean DEFAULT false,
	"is_formatative_test2" boolean DEFAULT false,
	"is_formatative_test3" boolean DEFAULT false,
	"is_formatative_test4" boolean DEFAULT false,
	"is_summative_assessment1" boolean DEFAULT false,
	"is_summative_assessment2" boolean DEFAULT false,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_types_sequence_unique" UNIQUE("sequence")
);
--> statement-breakpoint
CREATE TABLE "floors" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_floor_id" integer,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "floors_sequence_unique" UNIQUE("sequence"),
	CONSTRAINT "floors_legacyFloorId_name_unique" UNIQUE("legacy_floor_id","name")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_room_id" integer,
	"name" varchar(500) NOT NULL,
	"short_name" varchar(500),
	"strength" integer DEFAULT 0 NOT NULL,
	"exam_capacity" integer DEFAULT 0 NOT NULL,
	"benches" integer DEFAULT 0 NOT NULL,
	"floor_id" integer,
	"sequence" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_sequence_unique" UNIQUE("sequence"),
	CONSTRAINT "rooms_legacyRoomId_name_unique" UNIQUE("legacy_room_id","name")
);
--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE no action ON UPDATE no action;