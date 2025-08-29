import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const departmentModel = pgTable("departments", {
    id: serial().primaryKey(),
    legacyDepartmentId: integer(),
    name: varchar({ length: 900 }).notNull().unique(),
    code: varchar({ length: 100 }).notNull().unique(),
    description: varchar({ length: 2000 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createDepartmentSchema = createInsertSchema(departmentModel);

export type Department = z.infer<typeof createDepartmentSchema>;

export type DepartmentT = typeof createDepartmentSchema._type;