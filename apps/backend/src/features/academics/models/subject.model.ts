import { integer, numeric, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { marksheetModel } from "./marksheet.model.ts";
import { subjectMetadataModel } from "./subjectMetadata.model.ts";
import { relations } from "drizzle-orm";

export const subjectModel = pgTable("subjects", {
    id: serial().primaryKey(),
    marksheetId: integer("marksheet_id_fk").references(() => marksheetModel.id),
    subjectMetadataId: integer("subject_metadata_id_fk").references(() => subjectMetadataModel.id),
    internalMarks: integer(),
    theoryMarks: integer(),
    practicalMarks: integer(),
    totalMarks: integer(),
    status: varchar({ length: 255 }),
    letterGrade: varchar({ length: 255 }),
    ngp: numeric(),
    tgp: numeric(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const subjectRelations = relations(subjectModel, ({ one }) => ({
    marksheet: one(marksheetModel, {
        fields: [subjectModel.marksheetId],
        references: [marksheetModel.id]
    }),
    subjectMetadata: one(subjectMetadataModel, {
        fields: [subjectModel.subjectMetadataId],
        references: [subjectMetadataModel.id]
    })
}))