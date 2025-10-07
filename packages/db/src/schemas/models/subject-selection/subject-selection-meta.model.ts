import { integer, pgTable, serial, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { subjectTypeModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { academicYearModel } from "../academics";

export const subjectSelectionMetaModel = pgTable("subject_selection_meta", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    subjectTypeId: integer("subject_type_id_fk")
        .references(() => subjectTypeModel.id)
        .notNull(),
    label: varchar("label", { length: 255 })
        .notNull(),
    sequence: integer("sequence"),
    isActive: boolean().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectSelectionMeta = createInsertSchema(subjectSelectionMetaModel);

export type SubjectSelectionMeta = z.infer<typeof createSubjectSelectionMeta>;

export type SubjectSelectionMetaT = typeof createSubjectSelectionMeta._type;