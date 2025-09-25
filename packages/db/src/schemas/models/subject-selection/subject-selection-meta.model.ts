import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { streamModel, subjectTypeModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const subjectSelectionMetaModel = pgTable("subject_selection_meta", {
    id: serial().primaryKey(),
    streamId: integer("stream_id_fk")
        .references(() => streamModel.id)
        .notNull(),
    subjectTypeId: integer("subject_type_id_fk")
        .references(() => subjectTypeModel.id)
        .notNull(),
    label: varchar("label", { length: 255 })
        .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectSelectionMeta = createInsertSchema(subjectSelectionMetaModel);

export type SubjectSelectionMeta = z.infer<typeof createSubjectSelectionMeta>;

export type SubjectSelectionMetaT = typeof createSubjectSelectionMeta._type;