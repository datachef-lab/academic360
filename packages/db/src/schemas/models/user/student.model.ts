import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { userModel } from "@/schemas/models/user";
import { communityTypeEnum } from "@/schemas/enums";
import { programCourseModel, specializationModel } from "@/schemas/models/course-design";
import { admissionCourseDetailsModel, applicationFormModel } from "@/schemas/models/admissions";
// import { sectionModel, shiftModel } from "../academics";
import z from "zod";

export const studentModel = pgTable("students", {
    id: serial().primaryKey(),
    legacyStudentId: integer(),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    applicationId: integer("application_form_id_fk")
        .references(() => applicationFormModel.id),
    admissionCourseDetailsId: integer("admission_course_details_id_fk")
        .references(() => admissionCourseDetailsModel.id),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    specializationId: integer("specialization_id_fk").references(() => specializationModel.id),
    uid: varchar({ length: 255 }).notNull().unique(),
    oldUid: varchar({ length: 255 }),
    rfidNumber: varchar({ length: 255 }),
    cuFormNumber: varchar({ length: 255 }),
    registrationNumber: varchar({ length: 255 }),
    rollNumber: varchar({ length: 255 }),
    classRollNumber: varchar({ length: 255 }),
    apaarId: varchar({ length: 255 }),
    belongsToEWS: boolean().default(false),
    checkRepeat: boolean(),
    community: communityTypeEnum(),
    handicapped: boolean().default(false),
    lastPassedYear: integer(),
    notes: text(),
    active: boolean(),
    alumni: boolean(),
    leavingDate: timestamp(),
    leavingReason: text(),
    takenTransferCertificate: boolean().default(false),
    hasCancelledAdmission: boolean().default(false),
    cancelledAdmissionReason: varchar({ length: 1000 }),
    cancelledAdmissionAt: timestamp(),
    cancelledAdmissionByUserId: integer("cancelled_admission_by_user_id_fk")
        .references(() => userModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const studentRelations = relations(studentModel, ({ one }) => ({
    user: one(userModel, {
        fields: [studentModel.userId],
        references: [userModel.id],
    }),
    specialization: one(specializationModel, {
        fields: [studentModel.specializationId],
        references: [specializationModel.id],
    }),
}))

export const createStudentSchema = createInsertSchema(studentModel);
export type Student = z.infer<typeof createStudentSchema>;

export type StudentT = typeof createStudentSchema._type;


