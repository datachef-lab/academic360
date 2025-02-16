import { integer, numeric, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { marksheetModel } from "@/features/academics/models/marksheet.model.js";
import { subjectMetadataModel } from "./subjectMetadata.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subjectStatusType = pgEnum("subject_status", ["PASS", "FAIL"]);

export const subjectModel = pgTable("subjects", {
    id: serial().primaryKey(),
    marksheetId: integer("marksheet_id_fk").references(() => marksheetModel.id),
    subjectMetadataId: integer("subject_metadata_id_fk").references(() => subjectMetadataModel.id),
    internalMarks: integer(),
    theoryMarks: integer(),
    practicalMarks: integer(),
    tutorialMarks: integer(),
    totalMarks: integer(),
    status: subjectStatusType(),
    letterGrade: varchar({ length: 255 }),
    ngp: numeric({
        precision: 3,
        scale: 5
    }),
    tgp: numeric({
        precision: 3,
        scale: 5
    }),
    year1: integer().notNull(),
    year2: integer(),
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

export const createSubjectSchema = createInsertSchema(subjectModel);

export type Subject = z.infer<typeof createSubjectSchema>;