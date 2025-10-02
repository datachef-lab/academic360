import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import {
    pgTable,
    timestamp,
    integer,
    boolean,
    serial,
    varchar,
    text,
    pgEnum
} from "drizzle-orm/pg-core";

import { academicYearModel } from "@/schemas/models/academics";
import { programCourseModel } from "@/schemas/models/course-design";

// Process types enum
export const processTypeEnum = pgEnum("process_type", [
    "SUBJECT_SELECTION",
    "CU_REGISTRATION"
]);

// Process status enum
export const processStatusEnum = pgEnum("process_status", [
    "INACTIVE",
    "ACTIVE",
    "PAUSED",
    "COMPLETED"
]);

export const processControlModel = pgTable("process_controls", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    semester: integer("semester").notNull(), // 1, 2, 3, 4, 5, 6, etc.
    processType: processTypeEnum("process_type").notNull(),
    status: processStatusEnum("status").default("INACTIVE").notNull(),

    // Process timing
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),

    // Process configuration
    isAutoStart: boolean("is_auto_start").default(false),
    isAutoEnd: boolean("is_auto_end").default(false),
    maxRetries: integer("max_retries").default(3),

    // Process metadata
    title: varchar("title", { length: 500 }),
    description: text("description"),
    instructions: text("instructions"),

    // Control flags
    allowLateSubmission: boolean("allow_late_submission").default(false),
    requireApproval: boolean("require_approval").default(true),
    sendNotifications: boolean("send_notifications").default(true),

    // Audit fields
    createdBy: integer("created_by_user_id_fk"),
    updatedBy: integer("updated_by_user_id_fk"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod Schemas for validation
export const insertProcessControlSchema = createInsertSchema(processControlModel);
export const selectProcessControlSchema = createSelectSchema(processControlModel);

// Type exports
export type ProcessControl = z.infer<typeof selectProcessControlSchema>;
export type NewProcessControl = z.infer<typeof insertProcessControlSchema>;
