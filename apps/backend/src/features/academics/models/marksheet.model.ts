import { integer, numeric, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "@/features/user/models/student.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const marksheetModel = pgTable("marksheets", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().references(() => studentModel.id),
    semester: integer().notNull(),
    year1: integer().notNull(),
    year2: integer(),
    sgpa: numeric(),
    cgpa: numeric(),
    remarks: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const marksheetRelations = relations(marksheetModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [marksheetModel.studentId],
        references: [studentModel.id]
    })
}));

export const createMarksheetModel = createInsertSchema(marksheetModel);

export type Marksheet = z.infer<typeof createMarksheetModel>;