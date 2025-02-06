import { boolean, integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.js";
import { streamModel } from "@/features/academics/models/stream.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { frameworkTypeEnum } from "@/features/academics/models/subjectMetadata.model.js";

export const courseTypeEnum = pgEnum("course_type", ["HONOURS", "GENERAL"]);

export const academicIdentifierModel = pgTable("academic_identifiers", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().unique().references(() => studentModel.id),
    frameworkType: frameworkTypeEnum(),
    rfid: varchar({ length: 255 }),
    streamId: integer("stream_id_fk").references(() => streamModel.id),
    course: courseTypeEnum(),
    cuFormNumber: varchar({ length: 255 }),
    uid: varchar({ length: 255 }),
    oldUid: varchar({ length: 255 }),
    registrationNumber: varchar({ length: 255 }),
    rollNumber: varchar({ length: 255 }),
    section: varchar({ length: 255 }),
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
}));

export const createAcademicIdentifierSchema = createInsertSchema(academicIdentifierModel);

export type AcademicIdentifier = z.infer<typeof createAcademicIdentifierSchema>;