import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { journalTypeModel } from "./journal-type.model";
import { entryModeModel } from "./entry-mode.model";
import { publisherModel } from "./publisher.model";
import { languageMediumModel } from "../resources";
import { bindingModel } from "./binding.model";
import { libraryPeriodModel } from "./library-period.model";
import { subjectGroupingMainModel } from "../course-design";

export const journalModel = pgTable("journals", {
    id: serial().primaryKey(),
    legacyJournalId: integer(),
    type: integer("journal_type_id_fk")
        .references(() => journalTypeModel.id),
    subjectGroupId: integer("subject_group_id_fk")
            .references(() => subjectGroupingMainModel.id),
    title: varchar({ length: 1000 }).notNull(),
    entryModeId: integer("entry_mode_id_fk")
        .references(() => entryModeModel.id),
    publisherId: integer("publisher_id_fk")
        .references(() => publisherModel.id),
    languageId: integer("language_id_fk")
        .references(() => languageMediumModel.id),
    bindingId: integer("binding_id_fk")
        .references(() => bindingModel.id),
    periodId: integer("period_id_fk")
        .references(() => libraryPeriodModel.id),
    issnNumber: varchar({ length: 1000 }),
    sizeInCM: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createJournalSchema = createInsertSchema(journalModel);

export type Journal = z.infer<typeof createJournalSchema>;

export type JournalT = typeof createJournalSchema._type;