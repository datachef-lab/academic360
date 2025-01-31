import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { personModel } from "./person.model.ts";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { studentModel } from "./student.model.ts";

export const gaurdianModel = pgTable("guardians", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().unique().references(() => studentModel.id),
    gaurdianDetailsId: integer("guardian_details_person_id_fk").references(() => personModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const gaurdianRelations = relations(gaurdianModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [gaurdianModel.studentId],
        references: [studentModel.id]
    }),
    gaurdianDetails: one(personModel, {
        fields: [gaurdianModel.gaurdianDetailsId],
        references: [personModel.id]
    }),
}));

export const createGuardianSchema = createInsertSchema(gaurdianModel);

export type Guardian = z.infer<typeof createGuardianSchema>;