import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const emergencyContactModel = pgTable("emergency_contacts", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").references(() => studentModel.id),
    personName: varchar({ length: 255 }),
    relationToStudent: varchar({ length: 255 }),
    email: varchar({ length: 255 }),
    phone: varchar({ length: 15 }),
    officePhone: varchar({ length: 15 }),
    residentialPhone: varchar({ length: 15 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const emergencyContactRelations = relations(emergencyContactModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [emergencyContactModel.studentId],
        references: [studentModel.id]
    }),
}));

export const createEmergencyContactSchema = createInsertSchema(emergencyContactModel);

export type EmergencyContact = z.infer<typeof createEmergencyContactSchema>;