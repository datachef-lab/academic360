import { boolean, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { userPrivilegeModel } from "./user-privilege.model";
import { appModuleModel } from "./app-module.model";
// import { programCourseModel } from "../course-design";
// import { departmentModel } from "./department.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const userPrivilegeSubModel = pgTable("user_privilege_sub", {
    id: serial().primaryKey(),
    userPrivilegeId: integer("user_privilege_id_fk")
        .references(() => userPrivilegeModel.id)
        .notNull(),
    appModuleId: integer("app_module_id_fk")
        .references(() => appModuleModel.id)
        .notNull(),
    isAccessible: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    userPrivilegeAppModuleProgramCourseDepartmentUnique: unique("uq_user_group_app_module_program_course_department").on(
        table.userPrivilegeId,
        table.appModuleId,
    )
}));

export const createUserPrivilegeSubSchema = createInsertSchema(userPrivilegeSubModel);

export type UserPrivilegeSub = z.infer<typeof createUserPrivilegeSubSchema>;

export type UserPrivilegeSubT = typeof createUserPrivilegeSubSchema._type;