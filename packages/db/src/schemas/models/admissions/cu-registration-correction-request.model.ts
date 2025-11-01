import { boolean, integer, pgTable, serial, text, timestamp, varchar, unique } from "drizzle-orm/pg-core";
import { studentModel, userModel } from "../user";
import { cuRegistrationCorrectionRequestStatusEnum } from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { academicYearModel } from "../academics";

export const cuRegistrationCorrectionRequestModel = pgTable("cu_registration_correction_requests", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id),
    cuRegistrationApplicationNumber: varchar("cu_registration_application_number", { length: 7 }).unique(), // Format: 017XXXX
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
    aadhaarCardNumberCorrectionRequest: boolean("aadhaar_card_number_correction_request").notNull().default(false),
    // Correction request flags for declaration
    introductoryDeclaration: boolean("introductory_declaration").notNull().default(false),
    subjectsCorrectionRequest: boolean("subjects_correction_request_flag").notNull().default(false),
    personalInfoDeclaration: boolean("personal_info_declaration").notNull().default(false),
    addressInfoDeclaration: boolean("address_info_declaration").notNull().default(false),
    subjectsDeclaration: boolean("subjects_declaration").notNull().default(false),
    documentsDeclaration: boolean("documents_declaration").notNull().default(false),
    physicalRegistrationDoneBy: integer("physical_registration_done_by_fk").references(() => userModel.id),
    physicalRegistrationDoneAt: timestamp("physical_registration_done_at"),
    lastUpdatedBy: integer("last_updated_by_fk").references(() => userModel.id),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    // Unique constraint: academic year + application number must be unique together
    academicYearApplicationNumberUnique: unique("academic_year_application_number_unique").on(
        table.academicYearId,
        table.cuRegistrationApplicationNumber
    ),
}));

export const cuRegistrationCorrectionRequestInsertSchema = createInsertSchema(cuRegistrationCorrectionRequestModel, {
    cuRegistrationApplicationNumber: z.string()
        .length(7, "CU Registration Application Number must be exactly 7 characters")
        .regex(/^017\d{4}$/, "CU Registration Application Number must be in format 017XXXX (4 digits after 017)")
});

export type CuRegistrationCorrectionRequestInsertTypeT = typeof cuRegistrationCorrectionRequestInsertSchema._type;

export type CuRegistrationCorrectionRequest = z.infer<typeof cuRegistrationCorrectionRequestInsertSchema>;