CREATE TABLE "library_floor_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id_fk" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"layout" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_cdl_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id_fk" integer NOT NULL,
	"user_id_fk" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_floor_plans" ADD CONSTRAINT "library_floor_plans_branch_id_fk_library_branches_id_fk" FOREIGN KEY ("branch_id_fk") REFERENCES "public"."library_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_cdl_sessions" ADD CONSTRAINT "library_cdl_sessions_book_id_fk_books_id_fk" FOREIGN KEY ("book_id_fk") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_cdl_sessions" ADD CONSTRAINT "library_cdl_sessions_user_id_fk_users_id_fk" FOREIGN KEY ("user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;