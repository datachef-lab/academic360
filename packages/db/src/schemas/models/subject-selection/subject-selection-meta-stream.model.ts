import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { subjectSelectionMetaModel } from "./subject-selection-meta.model";
import { streamModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const subjectSelectionMetaStreamModel = pgTable("subject_selection_meta_streams", {
    id: serial("id").primaryKey(),
    subjectSelectionMetaId: integer("subject_selection_meta_id")
        .references(() => subjectSelectionMetaModel.id)
        .notNull(),
    streamId: integer("stream_id").references(() => streamModel.id)
        .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectSelectionMetaStream = createInsertSchema(subjectSelectionMetaStreamModel);

export type SubjectSelectionMetaStream = z.infer<typeof createSubjectSelectionMetaStream>;

export type SubjectSelectionMetaStreamT = typeof createSubjectSelectionMetaStream._type;