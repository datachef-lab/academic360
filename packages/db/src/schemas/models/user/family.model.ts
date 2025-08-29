import { z } from "zod";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { parentTypeEnum } from "@/schemas/enums";
import { annualIncomeModel } from "@/schemas/models/resources";
import { studentModel, personModel } from "@/schemas/models/user";

export const familyModel = pgTable("family_details", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().unique().references(() => studentModel.id),
    parentType: parentTypeEnum(),
    fatherDetailsId: integer("father_details_person_id_fk").references(() => personModel.id),
    motherDetailsId: integer("mother_details_person_id_fk").references(() => personModel.id),
    guardianDetailsId: integer("guardian_details_person_id_fk").references(() => personModel.id),
    annualIncomeId: integer("annual_income_id_fk").references(() => annualIncomeModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const parentRelations = relations(familyModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [familyModel.studentId],
        references: [studentModel.id]
    }),
    father: one(personModel, {
        fields: [familyModel.fatherDetailsId],
        references: [personModel.id]
    }),
    mother: one(personModel, {
        fields: [familyModel.motherDetailsId],
        references: [personModel.id]
    }),
    guardian: one(personModel, {
        fields: [familyModel.guardianDetailsId],
        references: [personModel.id]
    }),
    annualIncome: one(annualIncomeModel, {
        fields: [familyModel.annualIncomeId],
        references: [annualIncomeModel.id]
    }),
}));

export const createFamilySchema = createInsertSchema(familyModel);

export type Family = z.infer<typeof createFamilySchema>;

export type FamilyT = typeof createFamilySchema._type;