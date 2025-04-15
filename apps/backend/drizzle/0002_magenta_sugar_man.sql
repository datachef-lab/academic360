CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"from" date NOT NULL,
	"to" date NOT NULL,
	"is_current_session" boolean DEFAULT false NOT NULL,
	"code_prefix" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "session_id_fk" integer;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_session_id_fk_sessions_id_fk" FOREIGN KEY ("session_id_fk") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" DROP COLUMN "session";