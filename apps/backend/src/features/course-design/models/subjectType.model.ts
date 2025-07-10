import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subjectTypeModel = pgTable("subject_types", {
    id: serial().primaryKey(),
    irpName: varchar({ length: 500 }),
    irpCode: varchar({ length: 500 }),
    name: varchar({ length: 255 }),
    code: varchar({ length: 255 }),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectTypeSchema = createInsertSchema(subjectTypeModel);

export type SubjectType = z.infer<typeof createSubjectTypeSchema>;