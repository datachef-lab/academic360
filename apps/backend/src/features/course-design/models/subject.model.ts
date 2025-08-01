import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subjectModel = pgTable("subjects", {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 500 }),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectSchema = createInsertSchema(subjectModel);

export type Subject = z.infer<typeof createSubjectSchema>;
