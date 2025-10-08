CREATE TABLE "cu_registration_correction_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"cu_registration_application_number" varchar(7) NOT NULL,
	"student_id_fk" integer NOT NULL,
	"status" "cu_registration_correction_request_status" DEFAULT 'PENDING' NOT NULL,
	"remarks" text,
	"gender_correction_request" boolean DEFAULT false NOT NULL,
	"nationality_correction_request" boolean DEFAULT false NOT NULL,
	"apaar_id_correction_request" boolean DEFAULT false NOT NULL,
	"subjects_correction_request_flag" boolean DEFAULT false NOT NULL,
	"approved_by_fk" integer,
	"approved_at" timestamp,
	"approved_remarks" text,
	"rejected_by_fk" integer,
	"rejected_at" timestamp,
	"rejected_remarks" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cu_registration_document_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"cu_registration_correction_request_id_fk" integer NOT NULL,
	"document_id_fk" integer NOT NULL,
	"document_url" varchar(255),
	"path" varchar(255),
	"file_name" varchar(255),
	"file_type" varchar(255),
	"file_size" integer,
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD CONSTRAINT "cu_registration_correction_requests_student_id_fk_students_id_fk" FOREIGN KEY ("student_id_fk") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD CONSTRAINT "cu_registration_correction_requests_approved_by_fk_users_id_fk" FOREIGN KEY ("approved_by_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cu_registration_correction_requests" ADD CONSTRAINT "cu_registration_correction_requests_rejected_by_fk_users_id_fk" FOREIGN KEY ("rejected_by_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cu_registration_document_uploads" ADD CONSTRAINT "cu_registration_document_uploads_cu_registration_correction_request_id_fk_cu_registration_correction_requests_id_fk" FOREIGN KEY ("cu_registration_correction_request_id_fk") REFERENCES "public"."cu_registration_correction_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cu_registration_document_uploads" ADD CONSTRAINT "cu_registration_document_uploads_document_id_fk_documents_id_fk" FOREIGN KEY ("document_id_fk") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;