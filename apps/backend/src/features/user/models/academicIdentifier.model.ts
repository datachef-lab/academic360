import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { courseTypeEnum, frameworkTypeEnum, studentModel } from "./student.model.ts";
import { streamModel } from "@/features/academics/models/stream.model.ts";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const academicIdentifierModel = pgTable("academic_identifiers", {
    id: serial().primaryKey(),
    studentId: integer().notNull().unique().references(() => studentModel.id),
    frameworkType: frameworkTypeEnum().default("CBCS"),
    rfid: varchar({ length: 255 }),
    streamId: integer("stream_id_fk").references(() => streamModel.id),
    course: courseTypeEnum().default("HONOURS"),
    cuFormNumber: varchar({ length: 255 }),
    uid: varchar({ length: 255 }),
    oldUid: varchar({ length: 255 }),
    registrationNumber: varchar({ length: 255 }),
    rollNumber: varchar({ length: 255 }),
    section: varchar({ length: 255 }),
    classRollNumber: integer(),
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
}));

export const createAcademicIdentifierSchema = createInsertSchema(academicIdentifierModel);

export type AcademicIdentifier = z.infer<typeof createAcademicIdentifierSchema>;