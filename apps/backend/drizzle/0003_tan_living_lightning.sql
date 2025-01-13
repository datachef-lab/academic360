CREATE TYPE "public"."stream_level" AS ENUM('UNDER_GRADUATE', 'POST_GRADUATE');--> statement-breakpoint
CREATE TABLE "streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" "stream_level" DEFAULT 'UNDER_GRADUATE'
);
