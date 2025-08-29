import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const subjectTypeModel = pgTable("subject_types", {
    id: serial().primaryKey(),
    legacySubjectTypeId: integer("legacy_subject_type_id"),
    name: varchar({ length: 255 }),
    code: varchar({ length: 255 }),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectTypeSchema = createInsertSchema(subjectTypeModel);

export type SubjectType = z.infer<typeof createSubjectTypeSchema>;

export type SubjectTypeT = typeof createSubjectTypeSchema._type;