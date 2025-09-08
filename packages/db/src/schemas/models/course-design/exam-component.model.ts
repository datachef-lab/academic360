import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const examComponentModel = pgTable("exam_components", {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    code: varchar({ length: 500 }),
    sequence: serial().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createExamComponentSchema = createInsertSchema(examComponentModel) as z.ZodTypeAny;

export type ExamComponent = z.infer<typeof createExamComponentSchema>;

export type ExamComponentT = typeof createExamComponentSchema._type;
