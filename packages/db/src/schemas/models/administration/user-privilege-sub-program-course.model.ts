import { boolean, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { userPrivilegeSubModel } from "./user-privilege-sub.model";
import { programCourseModel } from "../course-design";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const userPrivilegeSubProgramCourseModel = pgTable("user_privilege_sub_program_courses", {
    id: serial().primaryKey(),
    userPrivilegeSubId: integer("user_privilege_sub_id_fk")
        .references(() => userPrivilegeSubModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    isAccessible: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    unique: unique("uq_privilege_sub_program_course").on(
        table.userPrivilegeSubId,
        table.programCourseId,
    )
}));

export const createUserPrivilegeSubProgramCourseSchema = createInsertSchema(userPrivilegeSubProgramCourseModel);

export type UserPrivilegeSubProgramCourse = z.infer<typeof createUserPrivilegeSubProgramCourseSchema>;

export type UserPrivilegeSubProgramCourseT = typeof createUserPrivilegeSubProgramCourseSchema._type;