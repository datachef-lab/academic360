import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { restrictedGroupingMainModel } from "./restricted-grouping-main.model";
import { programCourseModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const restrictedGroupingProgramCourseModel = pgTable("restricted_grouping_program_courses", {
    id: serial().primaryKey(),
    restrictedGroupingMainId: integer("restricted_grouping_main_id_fk")
        .references(() => restrictedGroupingMainModel.id),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createRestrictedGroupingProgramCourse = createInsertSchema(restrictedGroupingProgramCourseModel);

export type RestrictedGroupingProgramCourse = z.infer<typeof createRestrictedGroupingProgramCourse>;

export type RestrictedGroupingProgramCourseT = typeof createRestrictedGroupingProgramCourse._type;