import { date, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.js";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admissionModel = pgTable("admissions", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().unique().references(() => studentModel.id),
    applicationNumber: varchar({ length: 255 }),
    applicantSignature: varchar({ length: 255 }),
    yearOfAdmission: integer(),
    admissionDate: date(),
    admissionCode: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const admissionRelations = relations(admissionModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [admissionModel.studentId],
        references: [studentModel.id],
    }),
}));

export const createAdmissionSchema = createInsertSchema(admissionModel);

export type Admission = z.infer<typeof createAdmissionSchema>;