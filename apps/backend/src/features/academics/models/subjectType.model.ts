import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subjectTypeModel = pgTable("subject_types", {
    id: serial().primaryKey(),
    irpName: varchar({ length: 500 }),
    irpShortName: varchar({ length: 500 }),
    marksheetName: varchar({ length: 500 }),
    marksheetShortName: varchar({ length: 500 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectTypeSchema = createInsertSchema(subjectTypeModel);

export type SubjectTypeModel = z.infer<typeof createSubjectTypeSchema>;