import { date, integer, pgTable, serial, timestamp, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { studentModel } from "../user";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { classModel } from "../academics";

export const cuPhysicalRegModel = pgTable(
    "cu_physical_reg",
    {
        id: serial().primaryKey(),
        studentId: integer("student_id_fk").references(() => studentModel.id).notNull(),
        classId: integer("class_id_fk").references(() => classModel.id).notNull(),
        time: varchar("time", { length: 255 }).notNull(),
        venue: varchar("venue", { length: 255 }).notNull(),
        submissionDate: date("submission_date"),
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    },
    (t) => ({
        uqStudentClass: uniqueIndex("cu_physical_reg_student_class_uq").on(t.studentId, t.classId),
    })
);

export const createCuPhysicalRegSchema = createInsertSchema(cuPhysicalRegModel);

export type CuPhysicalReg = z.infer<typeof createCuPhysicalRegSchema>;

export type CuPhysicalRegT = typeof createCuPhysicalRegSchema._type;   