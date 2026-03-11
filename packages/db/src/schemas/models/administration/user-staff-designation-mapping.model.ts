import { boolean, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { staffModel } from "../user";
import { designationModel } from "./designation.model";
import { departmentModel } from "./department.model";

export const userStaffDesignationMappingModel = pgTable("user_staff_designation_mapping", {
    id: serial().primaryKey(),
    staffId: integer("staff_id_fk")
        .references(() => staffModel.id)
        .notNull(),
    departmentId: integer("department_id_fk")
        .references(() => departmentModel.id), // NULLABLE → for Peon/Guard/Driver
    designationId: integer("designation_id_fk")
        .references(() => designationModel.id)
        .notNull(),
    isPrimary: boolean().default(false),
    isActive: boolean().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow()
        .$onUpdate(() => new Date()),
}, (table) => ({
    staffDesignationDeptUnique: unique("uq_staff_designation_dept").on(
        table.staffId,
        table.designationId,
        table.departmentId,  // unique per staff + designation + dept combination
    )
}));
