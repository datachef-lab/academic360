import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departmentModel = pgTable("departments", {
    id: serial().primaryKey(),
    name: varchar({ length: 900 }).notNull().unique(),
    code: varchar({ length: 100 }).notNull().unique(),
    description: varchar({ length: 2000 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createDepartmentSchema = createInsertSchema(departmentModel);

export type Department = z.infer<typeof createDepartmentSchema>;