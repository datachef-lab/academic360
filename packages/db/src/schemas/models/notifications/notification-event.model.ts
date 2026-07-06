import { integer, json, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { userModel } from "../user";
import { notificationMasterModel } from "./notification-master.model";
import { programCourseModel } from "../course-design";
import { academicYearModel, classModel } from "../academics";
import {
    notificationEventDataSourceEnum,
    notificationEventStatusEnum,
    notificationVariantEnum,
} from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const notificationEventModel = pgTable("notification_events", {
    id: serial().primaryKey(),
    createdByUserId: integer("created_by_user_id_fk")
        .references(() => userModel.id),
    updatedByUserId: integer("updated_by_user_id_fk")
        .references(() => userModel.id),
    emailTemplate: varchar({ length: 255 }),
    notificationMasterId: integer("notification_master_id_fk")
        .references(() => notificationMasterModel.id),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
    remarks: text("remarks"),

    // Channel to send this event on.
    variant: notificationVariantEnum(),

    // Primary cohort scope on the event itself (single-value). Affiliation &
    // regulation are NOT stored — the UI uses them only to narrow the
    // program-course choices; program_course encodes both. The remaining
    // multi-select dimensions live in the notification_event_* child tables.
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id),
    classId: integer("class_id_fk")
        .references(() => classModel.id),

    // How the per-recipient field values are populated.
    dataSourceMode: notificationEventDataSourceEnum("data_source_mode").default("UPLOAD"),
    // DRAFT → READY (recipients uploaded) → TRIGGERED (notifications enqueued).
    status: notificationEventStatusEnum().default("DRAFT"),
    // S3 key of the parsed recipient payload ({uid, userId, values}[] + unmatched).
    recipientsFileKey: text("recipients_file_key"),
    // { matched: number, unmatched: string[] } for quick preview.
    uploadSummary: json("upload_summary"),

    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const notificationEventInsertSchema = createInsertSchema(notificationEventModel);

export type NotificationEvent = z.infer<typeof notificationEventInsertSchema>;

export type NotificationEventT = typeof notificationEventModel.$inferSelect;
