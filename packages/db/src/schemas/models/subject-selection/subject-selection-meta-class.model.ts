import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { subjectSelectionMetaModel } from "./subject-selection-meta.model";
import { classModel } from "../academics";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const subjectSelectionMetaClassModel = pgTable("subject_selection_meta_classes", {
    id: serial().primaryKey(),
    subjectSelectionMetaId: integer("subject_selection_meta_id_fk")
        .references(() => subjectSelectionMetaModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectSelectionMetaClass = createInsertSchema(subjectSelectionMetaClassModel);

export type SubjectSelectionMetaClass = z.infer<typeof createSubjectSelectionMetaClass>;

export type SubjectSelectionMetaClassT = typeof createSubjectSelectionMetaClass._type;