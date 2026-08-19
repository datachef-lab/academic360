-- Reference-ID sequence for service tickets (SR-{YYYY}-{NNNNNN}).
-- Read at runtime via nextval() in ticket.service.ts; drizzle cannot
-- infer raw-SQL sequences from the models, so it is declared here.
CREATE SEQUENCE IF NOT EXISTS "service_ticket_ref_seq" START WITH 1 INCREMENT BY 1;
--> statement-breakpoint
CREATE TYPE "public"."gate_pass_status" AS ENUM('ACTIVE', 'USED', 'EXPIRED', 'REVOKED', 'BYPASS');
--> statement-breakpoint
CREATE TYPE "public"."id_proof_type" AS ENUM('OLD_ID_CARD', 'AADHAAR', 'PASSPORT', 'OTHER');
--> statement-breakpoint
CREATE TYPE "public"."service_requestor_type" AS ENUM('STUDENT', 'ALUMNI');
--> statement-breakpoint
CREATE TYPE "public"."service_ticket_status" AS ENUM('DRAFT', 'SUBMITTED', 'ROUTED', 'UNDER_REVIEW', 'APPROVED', 'PENDING_SLOT_BOOKING', 'SLOT_BOOKED', 'CHECKED_IN', 'FULFILLED', 'CLOSED', 'REJECTED', 'EXPIRED', 'CANCELLED');
--> statement-breakpoint
CREATE TYPE "public"."slot_booking_status" AS ENUM('BOOKED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');
--> statement-breakpoint
CREATE TYPE "public"."ticket_event_type" AS ENUM('CREATED', 'OTP_VERIFIED', 'SUBMITTED', 'ROUTED', 'REVIEW_STARTED', 'APPROVED', 'REJECTED', 'FULFILLMENT_SET', 'SLOT_BOOKED', 'SLOT_RESCHEDULED', 'GATE_PASS_ISSUED', 'CHECKED_IN', 'BYPASS_ISSUED', 'FULFILLED', 'CLOSED', 'CANCELLED', 'EXPIRED');
--> statement-breakpoint
CREATE TYPE "public"."weekday" AS ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');
--> statement-breakpoint
CREATE TABLE "service_type_routing" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"department_id_fk" integer,
	"sla_days" integer NOT NULL,
	"requires_physical_presence_default" boolean DEFAULT false NOT NULL,
	"requires_id_proof" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_type_routing_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "service_alumni_intake" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"year_of_passing" varchar(10) NOT NULL,
	"course_stream" varchar(255) NOT NULL,
	"university_reg_no" varchar(255),
	"college_roll_no" varchar(255),
	"mobile_whatsapp" varchar(20) NOT NULL,
	"email" varchar(500) NOT NULL,
	"id_proof_type" "id_proof_type" NOT NULL,
	"id_proof_s_3_key" varchar(1000),
	"id_proof_verified" boolean DEFAULT false NOT NULL,
	"contact_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_id" varchar(50) NOT NULL,
	"requestor_type" "service_requestor_type" NOT NULL,
	"student_user_id_fk" integer,
	"alumni_intake_id_fk" integer,
	"service_type_id_fk" integer NOT NULL,
	"department_id_fk" integer,
	"status" "service_ticket_status" DEFAULT 'DRAFT' NOT NULL,
	"sla_due_at" timestamp with time zone,
	"contact_email" varchar(500),
	"contact_phone" varchar(20),
	"contact_verified" boolean DEFAULT false NOT NULL,
	"requires_physical_presence" boolean,
	"details" jsonb,
	"routed_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"approved_by_user_id_fk" integer,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department_slot_windows" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id_fk" integer NOT NULL,
	"weekday" "weekday" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"slot_duration_minutes" integer DEFAULT 60 NOT NULL,
	"capacity_per_slot" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" date,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_slot_instances" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id_fk" integer NOT NULL,
	"slot_window_id_fk" integer NOT NULL,
	"slot_date" date NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"capacity" integer NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_slot_instances_booked_count_check" CHECK ("service_slot_instances"."booked_count" BETWEEN 0 AND "service_slot_instances"."capacity")
);
--> statement-breakpoint
CREATE TABLE "service_slot_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id_fk" integer NOT NULL,
	"slot_instance_id_fk" integer NOT NULL,
	"status" "slot_booking_status" DEFAULT 'BOOKED' NOT NULL,
	"booked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_gate_passes" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id_fk" integer NOT NULL,
	"slot_booking_id_fk" integer,
	"nonce" varchar(512) NOT NULL,
	"payload" jsonb,
	"status" "gate_pass_status" DEFAULT 'ACTIVE' NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_in_by_user_id_fk" integer,
	"is_bypass" boolean DEFAULT false NOT NULL,
	"supersedes_gate_pass_id_fk" integer,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_ticket_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id_fk" integer NOT NULL,
	"event_type" "ticket_event_type" NOT NULL,
	"from_status" "service_ticket_status",
	"to_status" "service_ticket_status",
	"actor_user_id_fk" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_type_routing" ADD CONSTRAINT "service_type_routing_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_student_user_id_fk_users_id_fk" FOREIGN KEY ("student_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_alumni_intake_id_fk_service_alumni_intake_id_fk" FOREIGN KEY ("alumni_intake_id_fk") REFERENCES "public"."service_alumni_intake"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_service_type_id_fk_service_type_routing_id_fk" FOREIGN KEY ("service_type_id_fk") REFERENCES "public"."service_type_routing"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_approved_by_user_id_fk_users_id_fk" FOREIGN KEY ("approved_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "department_slot_windows" ADD CONSTRAINT "department_slot_windows_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_slot_instances" ADD CONSTRAINT "service_slot_instances_department_id_fk_departments_id_fk" FOREIGN KEY ("department_id_fk") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_slot_instances" ADD CONSTRAINT "service_slot_instances_slot_window_id_fk_department_slot_windows_id_fk" FOREIGN KEY ("slot_window_id_fk") REFERENCES "public"."department_slot_windows"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_slot_bookings" ADD CONSTRAINT "service_slot_bookings_ticket_id_fk_service_tickets_id_fk" FOREIGN KEY ("ticket_id_fk") REFERENCES "public"."service_tickets"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_slot_bookings" ADD CONSTRAINT "service_slot_bookings_slot_instance_id_fk_service_slot_instances_id_fk" FOREIGN KEY ("slot_instance_id_fk") REFERENCES "public"."service_slot_instances"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_gate_passes" ADD CONSTRAINT "service_gate_passes_ticket_id_fk_service_tickets_id_fk" FOREIGN KEY ("ticket_id_fk") REFERENCES "public"."service_tickets"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_gate_passes" ADD CONSTRAINT "service_gate_passes_slot_booking_id_fk_service_slot_bookings_id_fk" FOREIGN KEY ("slot_booking_id_fk") REFERENCES "public"."service_slot_bookings"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_gate_passes" ADD CONSTRAINT "service_gate_passes_checked_in_by_user_id_fk_users_id_fk" FOREIGN KEY ("checked_in_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_gate_passes" ADD CONSTRAINT "service_gate_passes_supersedes_gate_pass_id_fk_service_gate_passes_id_fk" FOREIGN KEY ("supersedes_gate_pass_id_fk") REFERENCES "public"."service_gate_passes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_ticket_events" ADD CONSTRAINT "service_ticket_events_ticket_id_fk_service_tickets_id_fk" FOREIGN KEY ("ticket_id_fk") REFERENCES "public"."service_tickets"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "service_ticket_events" ADD CONSTRAINT "service_ticket_events_actor_user_id_fk_users_id_fk" FOREIGN KEY ("actor_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "service_tickets_reference_id_unique" ON "service_tickets" USING btree ("reference_id");
--> statement-breakpoint
CREATE INDEX "idx_service_tickets_dept_status" ON "service_tickets" USING btree ("department_id_fk","status");
--> statement-breakpoint
CREATE INDEX "idx_service_tickets_sla_due_at" ON "service_tickets" USING btree ("sla_due_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "service_slot_instances_dept_date_start_unique" ON "service_slot_instances" USING btree ("department_id_fk","slot_date","start_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "service_slot_bookings_ticket_active_unique" ON "service_slot_bookings" USING btree ("ticket_id_fk") WHERE "service_slot_bookings"."status" IN ('BOOKED', 'CHECKED_IN');
--> statement-breakpoint
CREATE UNIQUE INDEX "service_gate_passes_nonce_unique" ON "service_gate_passes" USING btree ("nonce");
--> statement-breakpoint
CREATE INDEX "idx_service_gate_passes_status_valid_until" ON "service_gate_passes" USING btree ("status","valid_until");
