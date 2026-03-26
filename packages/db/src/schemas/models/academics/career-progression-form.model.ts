import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { certificateMasterModel } from "./certificate-master.model";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";
import { academicYearModel } from "./academic-year.model";
import { studentModel } from "../user";

export const careerProgressionFormModel = pgTable("career_progression_forms", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createCareerProgressionFormSchema = createInsertSchema(careerProgressionFormModel);

export type CareerProgressionForm = z.infer<typeof createCareerProgressionFormSchema>;

export type CareerProgressionFormT = typeof createCareerProgressionFormSchema._type;