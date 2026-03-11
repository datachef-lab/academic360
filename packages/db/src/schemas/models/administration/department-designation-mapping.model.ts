// department-designation-mapping.model.ts
import { boolean, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { departmentModel } from "./department.model";
import { designationModel } from "./designation.model";

export const departmentDesignationMappingModel = pgTable("department_designation_mapping", {
    id: serial().primaryKey(),
    departmentId: integer("department_id_fk")
        .references(() => departmentModel.id)
        .notNull(),
    designationId: integer("designation_id_fk")
        .references(() => designationModel.id)
        .notNull(),
    isActive: boolean().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow()
        .$onUpdate(() => new Date()),
}, (table) => ({
    deptDesignationUnique: unique("uq_dept_designation").on(
        table.departmentId,
        table.designationId,
    )
}));

export const createDepartmentDesignationMappingSchema = createInsertSchema(departmentDesignationMappingModel);

export type DepartmentDesignationMapping = z.infer<typeof createDepartmentDesignationMappingSchema>;

export type DepartmentDesignationMappingT = typeof createDepartmentDesignationMappingSchema._type;