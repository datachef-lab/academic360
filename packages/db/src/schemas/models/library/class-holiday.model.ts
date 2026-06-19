import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { programCourseModel } from "../course-design";
import { holidayModel } from "./holiday.model";
import { classModel } from "../academics";

export const classHolidayModel = pgTable("class_holidays", {
    id: serial().primaryKey(),
    legacyHolidayStudentMappingId: integer(),
    holidayId: integer("holiday_id_fk")
        .references(() => holidayModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    isHoliday: boolean().notNull().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createClassHolidaySchema = createInsertSchema(classHolidayModel);

export type ClassHoliday = z.infer<typeof createClassHolidaySchema>;

export type ClassHolidayT = typeof createClassHolidaySchema._type;