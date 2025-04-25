import { boolean, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.js";
import { streamModel } from "@/features/academics/models/stream.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sectionModel } from "@/features/academics/models/section.model.js";
import { shiftModel } from "@/features/academics/models/shift.model.js";
//s
export const academicIdentifierModel = pgTable("academic_identifiers", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().unique().references(() => studentModel.id),
    rfid: varchar({ length: 255 }),
    streamId: integer("stream_id_fk").references(() => streamModel.id),
    shiftId: integer("shift_id_fk").references(() => shiftModel.id),
    cuFormNumber: varchar({ length: 255 }),
    uid: varchar({ length: 255 }),
    oldUid: varchar({ length: 255 }),
    registrationNumber: varchar({ length: 255 }),
    rollNumber: varchar({ length: 255 }),
    sectionId: integer("section_id_fk").references(() => sectionModel.id),
    classRollNumber: varchar({ length: 255 }),
    apaarId: varchar({ length: 255 }),
    abcId: varchar({ length: 255 }),
    apprid: varchar({ length: 255 }),
    checkRepeat: boolean(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const academicIdentifierRelations = relations(academicIdentifierModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [academicIdentifierModel.studentId],
        references: [studentModel.id],
    }),
    stream: one(streamModel, {
        fields: [academicIdentifierModel.streamId],
        references: [streamModel.id],
    }),
    shift: one(shiftModel, {
        fields: [academicIdentifierModel.shiftId],
        references: [shiftModel.id],
    }),
    section: one(sectionModel, {
        fields: [academicIdentifierModel.sectionId],
        references: [sectionModel.id],
    }),
}));

export const createAcademicIdentifierSchema = createInsertSchema(academicIdentifierModel);

export type AcademicIdentifier = z.infer<typeof createAcademicIdentifierSchema>;