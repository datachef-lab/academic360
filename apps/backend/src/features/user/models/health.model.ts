import { bloodGroupModel } from "@/features/resources/models/bloodGroup.model.js";
import { relations } from "drizzle-orm";
import { integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const healthModel = pgTable("health", {
    id: serial().primaryKey(),
    // TODO: Add faculty and teacher ids
    studentId: integer("student_id_fk").unique().references(() => studentModel.id),
    bloodGroupId: integer("blood_group_id_fk").references(() => bloodGroupModel.id),
    eyePowerLeft: numeric(),
    eyePowerRight: numeric(),
    height: numeric(),
    width: numeric(),
    pastMedicalHistory: text(),
    pastSurgicalHistory: text(),
    drugAllergy: text(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const healthRelations = relations(healthModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [healthModel.studentId],
        references: [studentModel.id]
    }),
    bloodGroup: one(bloodGroupModel, {
        fields: [healthModel.bloodGroupId],
        references: [bloodGroupModel.id]
    }),
}));

export const createHealthSchema = createInsertSchema(healthModel);

export type Health = z.infer<typeof createHealthSchema>;