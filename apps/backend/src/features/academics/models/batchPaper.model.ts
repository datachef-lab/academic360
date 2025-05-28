import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { batchModel } from "./batch.model.js";
import { paperModel } from "./paper.model.js";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { subjectMetadataModel } from "./subjectMetadata.model.js";

export const batchPaperModel = pgTable("batch_papers", {
    id: serial().primaryKey(),
    batchId: integer("batch_id_fk").notNull().references(() => batchModel.id),
    subjectMetadataId: integer("subject_metadata_id_fk").notNull().references(() => subjectMetadataModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const batchPaperRelations = relations(batchPaperModel, ({ one }) => ({
    batch: one(batchModel, {
        fields: [batchPaperModel.batchId],
        references: [batchModel.id],
    }),
    subjectMetadata: one(subjectMetadataModel, {
        fields: [batchPaperModel.subjectMetadataId],
        references: [subjectMetadataModel.id],
    })
}));

export const createBatchPaperSchema = createInsertSchema(batchPaperModel);

export type BatchPaper = z.infer<typeof createBatchPaperSchema>;