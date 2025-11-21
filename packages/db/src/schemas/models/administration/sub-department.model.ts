import { pgTable, serial, varchar, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { departmentModel } from "./department.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const subDepartmentModel = pgTable("sub_departments", {
    id: serial().primaryKey(),
    departmentId: integer("department_id_fk").references(() => departmentModel.id).notNull(),
    name: varchar({ length: 255 }).notNull(),
    shortName: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    isActive: boolean().default(true),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
});

export const subDepartmentInsertSchema = createInsertSchema(subDepartmentModel);

export type SubDepartment = z.infer<typeof subDepartmentInsertSchema>;
export type SubDepartmentT = typeof subDepartmentInsertSchema._type;