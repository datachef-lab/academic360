CREATE TYPE "public"."notification_queue_type" AS ENUM('EMAIL_QUEUE', 'WHATSAPP_QUEUE', 'SMS_QUEUE', 'WEB_QUEUE', 'IN_APP_QUEUE', 'DEAD_LETTER_QUEUE');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('UPLOAD', 'EDIT', 'UPDATE', 'INFO', 'FEE', 'EVENT', 'OTHER', 'ADMISSION', 'EXAM', 'MINOR_PAPER_SELECTION', 'SEMESTER_WISE_SUBJECT_SELECTION', 'ALERT', 'OTP');--> statement-breakpoint
CREATE TYPE "public"."notification_variant" AS ENUM('EMAIL', 'WHATSAPP', 'SMS', 'WEB', 'OTHER');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "send_staging_notifications" boolean DEFAULT false;