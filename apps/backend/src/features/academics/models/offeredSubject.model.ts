import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { subjectMetadataModel } from "./subjectMetadata.model.js";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

export const offeredSubjectModel = pgTable("offered_subjects", {
    id: serial().primaryKey(),
    subjectMetadataId: integer("subject_metadata_id_fk").notNull().references(() => subjectMetadataModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const offeredSubjectRelations = relations(offeredSubjectModel, ({ one }) => ({
    subjectMetadata: one(subjectMetadataModel, {
        fields: [offeredSubjectModel.subjectMetadataId],
        references: [subjectMetadataModel.id],
    }),
}));

export const createOfferedSubjectSchema = createInsertSchema(offeredSubjectModel);

export type OfferedSubject = z.infer<typeof createOfferedSubjectSchema>;