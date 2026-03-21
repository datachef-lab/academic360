import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { AnyPgColumn, boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";


export const departmentModel = pgTable("departments", {
   id: serial().primaryKey(),
   legacyDepartmentId: integer(),
   parentDepartmentId: integer("parent_department_id_fk")
       .references((): AnyPgColumn => departmentModel.id),
   name: varchar({ length: 900 }).notNull().unique(),
   code: varchar({ length: 100 }).notNull().unique(),
   description: varchar({ length: 2000 }).notNull(),
   isActive: boolean().default(true).notNull(),
   createdAt: timestamp("created_at").defaultNow(),
   updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});


export const createDepartmentSchema = createInsertSchema(departmentModel);


export type Department = z.infer<typeof createDepartmentSchema>;

export type DepartmentT = typeof createDepartmentSchema._type;