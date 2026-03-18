import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const designationModel = pgTable("designations", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: varchar({ length: 500 }),
    code: varchar({ length: 255 }),
    isActive: boolean().default(false).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});

export const createDesignationSchema = createInsertSchema(designationModel);

export type Designation = z.infer<typeof createDesignationSchema>;

export type DesignationT = typeof createDesignationSchema._type;
