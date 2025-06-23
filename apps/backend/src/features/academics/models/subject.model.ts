import { doublePrecision, integer, numeric, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { marksheetModel } from "@/features/academics/models/marksheet.model.js";
import { subjectMetadataModel } from "./subjectMetadata.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subjectStatusType = pgEnum("subject_status", [
    "PASS",
    "FAIL",
    "AB",
    "P",
    "F",
    "F(IN)",
    "F(PR)",
    "F(TH)"
]);

export const subjectModel = pgTable("subjects", {
    id: serial().primaryKey(),
    marksheetId: integer("marksheet_id_fk").references(() => marksheetModel.id),
    subjectMetadataId: integer("subject_metadata_id_fk").references(() => subjectMetadataModel.id),
    year1: integer().notNull(),
    year2: integer(),
    internalMarks: doublePrecision(),
    internalYear: integer(),
    internalCredit: doublePrecision(),
    practicalMarks: doublePrecision(),
    practicalYear: integer(),
    practicalCredit: doublePrecision(),
    theoryMarks: doublePrecision(),
    theoryYear: integer(),
    theoryCredit: doublePrecision(),
    totalMarks: doublePrecision(),
    vivalMarks: doublePrecision(),
    vivalYear: integer(),
    vivalCredit: doublePrecision(),
    projectMarks: doublePrecision(),
    projectYear: integer(),
    projectCredit: doublePrecision(),
    totalCredits: doublePrecision("total_credits"),
    status: subjectStatusType(),
    ngp: numeric(),
    tgp: numeric(),
    letterGrade: varchar({ length: 255 }),
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