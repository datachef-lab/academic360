CREATE TABLE "library_sync_state" (
	"table_name" varchar(120) PRIMARY KEY NOT NULL,
	"last_synced_at" timestamp NOT NULL,
	"last_success_at" timestamp,
	"last_error" text,
	"last_upserts" integer DEFAULT 0 NOT NULL,
	"last_deletes" integer DEFAULT 0 NOT NULL,
	"last_scanned" integer DEFAULT 0 NOT NULL,
	"last_duration_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
