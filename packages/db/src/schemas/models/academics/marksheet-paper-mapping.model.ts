import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { batchStudentPaperModel } from "@/schemas/models/course-design";
import { academicYearModel, marksheetModel } from "@/schemas/models/academics";

export const marksheetPaperMappingModel = pgTable("marksheet_paper_mapping", {
    id: serial().primaryKey(),
    marksheetId: integer("marksheet_id_fk")
        .references(() => marksheetModel.id)
        .notNull(),
    batchStudentPaperId: integer("batch_student_paper_id_fk")
        .references(() => batchStudentPaperModel.id)
        .notNull(),
    yearOfAppearanceId: integer("year_of_appearance_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    yearOfPassingId: integer("year_of_appearance_id_fk")
        .references(() => academicYearModel.id),
    totalCreditObtained: doublePrecision().default(0),
    totalMarksObtained: doublePrecision().default(0),
    tgp: doublePrecision().default(0),
    ngp: doublePrecision().default(0),
    letterGrade: varchar({ length: 10 }),
    status: varchar({ length: 10 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createMarksheetPaperMappingSchema = createInsertSchema(marksheetPaperMappingModel);

export type MarksheetPaperMapping = z.infer<typeof createMarksheetPaperMappingSchema>;