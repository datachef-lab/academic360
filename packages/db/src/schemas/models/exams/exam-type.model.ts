import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const examTypeModel = pgTable("exam_types", {
    id: serial().primaryKey(),
    legacyExamTypeId: integer(),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    isActive: boolean().default(true),
    foilNumberRequired: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createExamTypeSchema = createInsertSchema(examTypeModel);

export type ExamType = z.infer<typeof createExamTypeSchema>;

export type ExamTypeT = typeof examTypeModel.$inferSelect;