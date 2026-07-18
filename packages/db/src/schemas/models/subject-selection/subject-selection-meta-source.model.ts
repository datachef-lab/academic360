import { AnyPgColumn, index, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { subjectSelectionMetaModel } from "./subject-selection-meta.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

/**
 * Which other metas a meta draws its student options from, when its
 * `optionSource` is PRIOR_SELECTION.
 *
 * e.g. a "Minor 5" meta (Semester V) with sources = [Minor 1, Minor 2] offers a
 * student only the subjects that student already selected under Minor 1 and
 * Minor 2. Removing Minor 2 from the sources narrows it to Minor 1 alone — the
 * point of the feature is that this is configuration, not code.
 *
 * Self-referential M2M: both columns point at subject_selection_meta. Follows
 * the shape of subject_selection_meta_classes, with the AnyPgColumn
 * self-reference used elsewhere (student_subject_selections.parent_id_fk,
 * papers.previous_paper_id_fk).
 */
export const subjectSelectionMetaSourceModel = pgTable("subject_selection_meta_sources", {
    id: serial().primaryKey(),
    /** The meta being configured (the one shown to the student). */
    subjectSelectionMetaId: integer("subject_selection_meta_id_fk")
        .references(() => subjectSelectionMetaModel.id)
        .notNull(),
    /** A meta whose prior student selections become this meta's options. */
    sourceSubjectSelectionMetaId: integer("source_subject_selection_meta_id_fk")
        .references((): AnyPgColumn => subjectSelectionMetaModel.id)
        .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
    // Option building looks up all sources for a meta on every student load.
    metaIdx: index("subject_selection_meta_sources_meta_id_idx").on(t.subjectSelectionMetaId),
    // A source may only be listed once per meta.
    uniqueMetaSource: unique("subject_selection_meta_sources_unique").on(
        t.subjectSelectionMetaId,
        t.sourceSubjectSelectionMetaId,
    ),
}));

export const createSubjectSelectionMetaSource = createInsertSchema(subjectSelectionMetaSourceModel);

export type SubjectSelectionMetaSource = z.infer<typeof createSubjectSelectionMetaSource>;

export type SubjectSelectionMetaSourceT = typeof createSubjectSelectionMetaSource._type;
