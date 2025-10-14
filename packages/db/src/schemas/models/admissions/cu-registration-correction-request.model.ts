import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel, userModel } from "../user";
import { cuRegistrationCorrectionRequestStatusEnum } from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const cuRegistrationCorrectionRequestModel = pgTable("cu_registration_correction_requests", {
    id: serial().primaryKey(),
    cuRegistrationApplicationNumber: varchar("cu_registration_application_number", { length: 7 }).notNull(), // Format: 017XXXX
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    status: cuRegistrationCorrectionRequestStatusEnum("status").notNull().default("PENDING"),
    onlineRegistrationDone: boolean("online_registration_done").notNull().default(false),
    physicalRegistrationDone: boolean("physical_registration_done").notNull().default(false),
    remarks: text("remarks"),
    // Correction request flags for personal information
    genderCorrectionRequest: boolean("gender_correction_request").notNull().default(false),
    nationalityCorrectionRequest: boolean("nationality_correction_request").notNull().default(false),
    apaarIdCorrectionRequest: boolean("apaar_id_correction_request").notNull().default(false),
    // Correction request flags for subjects
    subjectsCorrectionRequest: boolean("subjects_correction_request_flag").notNull().default(false),
    approvedBy: integer("approved_by_fk").references(() => userModel.id),
    approvedAt: timestamp("approved_at"),
    approvedRemarks: text("approved_remarks"),
    rejectedBy: integer("rejected_by_fk").references(() => userModel.id),
    rejectedAt: timestamp("rejected_at"),
    rejectedRemarks: text("rejected_remarks"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const cuRegistrationCorrectionRequestInsertSchema = createInsertSchema(cuRegistrationCorrectionRequestModel, {
    cuRegistrationApplicationNumber: z.string()
        .length(7, "CU Registration Application Number must be exactly 7 characters")
        .regex(/^017\d{4}$/, "CU Registration Application Number must be in format 017XXXX (4 digits after 017)")
});

export type CuRegistrationCorrectionRequestInsertTypeT = typeof cuRegistrationCorrectionRequestInsertSchema._type;

export type CuRegistrationCorrectionRequest = z.infer<typeof cuRegistrationCorrectionRequestInsertSchema>;