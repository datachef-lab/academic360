import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { streamModel } from "@/features/academics/models/stream.model.ts";
import { frameworkTypeEnum } from "@/features/user/models/student.model.ts";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

export const subjectTypeEnum = pgEnum("subject_type", [
    "COMMON",
    "SPECIAL",
    "HONOURS",
    "GENERAL",
    "ELECTIVE"
]);

export const subjectMetadataModel = pgTable("subject_metadatas", {
    id: serial().primaryKey(),
    streamId: integer("stream_id_fk").notNull().references(() => streamModel.id),
    semester: integer().notNull(),
    framework: frameworkTypeEnum().notNull().default("CBCS"),
    subjectType: subjectTypeEnum().notNull().default("COMMON"),
    name: varchar({length: 255}).notNull(),
    credit: integer(),
    fullMarks: integer().notNull(),
    fullMarksInternal: integer().notNull(),
    fullMarksPractical: integer(),
    fullMarksTheory: integer().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const subjectMetadataRelations = relations(subjectMetadataModel, ({ one }) => ({
    stream: one(streamModel, {
        fields: [subjectMetadataModel.id],
        references: [streamModel.id]
    })
}));

export const createSubjectMetadataSchema = createInsertSchema(subjectMetadataModel);

export type SubjectMetadata = z.infer<typeof createSubjectMetadataSchema>;