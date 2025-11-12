import { boolean, doublePrecision, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const examTypeModel = pgTable("exam_types", {
    id: serial().primaryKey(),
    legacyExamTypeId: integer(),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    description: text(),
    carry: varchar({ length: 500 }),
    isBoardExam: boolean().default(false),
    passingMarks: doublePrecision().notNull().default(0),
    fullMarks: doublePrecision().notNull().default(0),
    weightage: doublePrecision().notNull().default(0),
    writtenPassingMarks: doublePrecision().notNull().default(0),
    writtenFullMarks: doublePrecision().notNull().default(0),
    oralPassingMarks: doublePrecision().notNull().default(0),
    oralFullMarks: doublePrecision().notNull().default(0),
    review: boolean().default(false),
    isFormatativeTest1: boolean().default(false),
    isFormatativeTest2: boolean().default(false),
    isFormatativeTest3: boolean().default(false),
    isFormatativeTest4: boolean().default(false),
    isSummativeAssessment1: boolean().default(false),
    isSummativeAssessment2: boolean().default(false),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createExamTypeSchema = createInsertSchema(examTypeModel);

export type ExamType = z.infer<typeof createExamTypeSchema>;

export type ExamTypeT = typeof examTypeModel.$inferSelect;