import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { streamModel } from "@/features/academics/models/stream.model.ts";

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

