import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { userModel } from "@/schemas/models/user";
import { communityTypeEnum } from "@/schemas/enums";
import { programCourseModel, specializationModel } from "@/schemas/models/course-design";
import { applicationFormModel } from "@/schemas/models/admissions";
import { sectionModel, shiftModel } from "../academics";
import z from "zod";

export const studentModel = pgTable("students", {
    id: serial().primaryKey(),
    legacyStudentId: integer(),
    userId: integer("user_id_fk").notNull().references(() => userModel.id),
    applicationId: integer("application_id_fk")
        .references(() => applicationFormModel.id),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    specializationId: integer("specialization_id_fk").references(() => specializationModel.id),
    uid: varchar({ length: 255 }).notNull().unique(),
    rfidNumber: varchar({ length: 255 }),
    cuFormNumber: varchar({ length: 255 }),
    registrationNumber: varchar({ length: 255 }),
    rollNumber: varchar({ length: 255 }),
    sectionId: integer("section_id_fk").references(() => sectionModel.id),
    shiftId: integer("shift_id_fk")
        .references(() => shiftModel.id, { onDelete: "cascade", onUpdate: "cascade" })
        .notNull(),
    classRollNumber: varchar({ length: 255 }),
    apaarId: varchar({ length: 255 }),
    abcId: varchar({ length: 255 }),
    apprid: varchar({ length: 255 }),
    checkRepeat: boolean(),
    community: communityTypeEnum(),
    handicapped: boolean().default(false),
    lastPassedYear: integer(),
    notes: text(),
    active: boolean(),
    alumni: boolean(),
    leavingDate: timestamp(),
    leavingReason: text(),
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


