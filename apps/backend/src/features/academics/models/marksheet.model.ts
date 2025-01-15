import { integer, numeric, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.ts";
import { relations } from "drizzle-orm";

export const marksheetModel = pgTable("marksheets", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().references(() => studentModel.id),
    semester: integer().notNull(),
    year1: integer().notNull(),
    year2: integer(),
    sgpa: numeric(),
    cgpa: numeric(),
    remarks: varchar({ length: 255 }),
});

export const marksheetRelations = relations(marksheetModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [marksheetModel.studentId],
        references: [studentModel.id]
    })
}));    