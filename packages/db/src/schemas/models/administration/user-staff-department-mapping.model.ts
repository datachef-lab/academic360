import { integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { staffModel } from "../user";
import { departmentModel } from "./department.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const userStaffDepartmentMappingModel = pgTable("user_staff_depatment_mapping", {
    id: serial().primaryKey(),
    staffId: integer("staff_id_fk")
        .references(() => staffModel.id)
        .notNull(),
    departmentId: integer("department_id_fk")
        .references(() => departmentModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
    staffDepartmentUnique: unique("uq_staff_department").on(
        table.staffId,
        table.departmentId
    )
}));

export const createUserStaffDepartmentSchema = createInsertSchema(userStaffDepartmentMappingModel);

export type UserStaffDepartment = z.infer<typeof createUserStaffDepartmentSchema>;

export type UserStaffDepartmentT = typeof createUserStaffDepartmentSchema._type;