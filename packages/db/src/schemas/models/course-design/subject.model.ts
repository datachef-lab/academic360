import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar, index } from "drizzle-orm/pg-core";

export const subjectModel = pgTable("subjects", {
    id: serial().primaryKey(),
    legacySubjectId: integer("legacy_subject_id"),
    name: varchar({ length: 500 }).notNull(),
    code: varchar({ length: 500 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    // Primary key is already indexed, but add search indexes
    nameIdx: index("idx_subjects_name").on(table.name),
    codeIdx: index("idx_subjects_code").on(table.code),
    isActiveIdx: index("idx_subjects_active").on(table.isActive),
    legacySubjectIdIdx: index("idx_subjects_legacy_id").on(table.legacySubjectId),
}));

export const createSubjectSchema = createInsertSchema(subjectModel);

export type Subject = z.infer<typeof createSubjectSchema>;

export type SubjectT = typeof createSubjectSchema._type;