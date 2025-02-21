import { integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.js";
import { relations } from "drizzle-orm";
import { personModel } from "./person.model.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { annualIncomeModel } from "../../resources/models/annualIncome.model.js";
import { parentTypeEnum } from "./helper.js";

export const parentModel = pgTable("parent_details", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().unique().references(() => studentModel.id),
    parentType: parentTypeEnum(),
    fatherDetailsId: integer("father_details_person_id_fk").references(() => personModel.id),
    motherDetailsId: integer("mother_details_person_id_fk").references(() => personModel.id),
    annualIncomeId: integer("annual_income_id_fk").references(() => annualIncomeModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const parentRelations = relations(parentModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [parentModel.studentId],
        references: [studentModel.id]
    }),
    father: one(personModel, {
        fields: [parentModel.fatherDetailsId],
        references: [personModel.id]
    }),
    mother: one(personModel, {
        fields: [parentModel.motherDetailsId],
        references: [personModel.id]
    }),
    annualIncome: one(annualIncomeModel, {
        fields: [parentModel.annualIncomeId],
        references: [annualIncomeModel.id]
    }),
}));

export const createParentSchema = createInsertSchema(parentModel);

export type Parent = z.infer<typeof createParentSchema>;