import { z } from "zod";
import { integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const designationModel = pgTable("designations", {
    id: serial().primaryKey(),
    legacyDesignationId: integer(),
    name: varchar({ length: 900 }).notNull().unique(),
    description: varchar({ length: 2000 }),
    isActive: boolean().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createDesignationSchema = createInsertSchema(designationModel);

export type Designation = z.infer<typeof createDesignationSchema>;

export type DesignationT = typeof createDesignationSchema._type;