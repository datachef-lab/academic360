import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { accessGroupModuleModel } from "./access-group-module.model";
import { programCourseModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const accessGroupModuleProgramCourseModel = pgTable("access_group_module__program_course", {
    id: serial().primaryKey(),
    accessGroupModuleId: integer("access_group_module_id_fk")
        .references(() => accessGroupModuleModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    isAvailable: boolean().default(true).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createAccessGroupModuleProgramCourseSchema = createInsertSchema(accessGroupModuleProgramCourseModel);

export type AccessGroupModuleProgramCourse = z.infer<typeof createAccessGroupModuleProgramCourseSchema>;

export type AccessGroupModuleProgramCourseT = typeof createAccessGroupModuleProgramCourseSchema._type;