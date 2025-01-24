import { integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.ts";
import { relations } from "drizzle-orm";
import { personModel } from "./person.model.ts";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const parentTypeEnum = pgEnum("parent_type", ["BOTH", "FATHER_ONLY", "MOTHER_ONLY"]);

export const parentModel = pgTable("parent_details", {
    id: serial().primaryKey(),
    studentId: integer().notNull().unique().references(() => studentModel.id),
    parentType: parentTypeEnum(),
    fatherDetailsId: integer().references(() => personModel.id),
    motherDetailsId: integer().references(() => personModel.id),
    annualIncome: varchar({ length: 255 }),
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
}));

export const createParentSchema = createInsertSchema(parentModel);

export type Parent = z.infer<typeof createParentSchema>;