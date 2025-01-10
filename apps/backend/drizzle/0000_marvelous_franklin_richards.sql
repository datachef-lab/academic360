CREATE TYPE "public"."user_type" AS ENUM('ADMIN', 'STUDENT');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(500) NOT NULL,
	"password" varchar(255) NOT NULL,
	"phone" varchar(11),
	"image" varchar(255),
	"type" "user_type" DEFAULT 'STUDENT',
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
