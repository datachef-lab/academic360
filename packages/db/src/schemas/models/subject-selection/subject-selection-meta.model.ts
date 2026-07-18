import { index, integer, pgTable, serial, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { subjectTypeModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { academicYearModel } from "../academics";
import { subjectSelectionOptionSourceEnum } from "@/schemas/enums";

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
    /**
     * Where this meta's selectable subject options come from. Defaults to the
     * existing behaviour (the academic year's elective subjects), so every
     * existing meta keeps behaving exactly as before. When set to
     * PRIOR_SELECTION the options come from the student's own selections in the
     * metas listed in `subject_selection_meta_sources`.
     */
    optionSource: subjectSelectionOptionSourceEnum("option_source")
        .notNull()
        .default("ELECTIVE_SUBJECTS"),
    isActive: boolean().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    // Reports load all metas for an academic year, then join by subject type.
    academicYearIdx: index("subject_selection_meta_academic_year_id_idx").on(t.academicYearId),
    subjectTypeIdx: index("subject_selection_meta_subject_type_id_idx").on(t.subjectTypeId),
}));

export const createSubjectSelectionMeta = createInsertSchema(subjectSelectionMetaModel);

export type SubjectSelectionMeta = z.infer<typeof createSubjectSelectionMeta>;

export type SubjectSelectionMetaT = typeof createSubjectSelectionMeta._type;