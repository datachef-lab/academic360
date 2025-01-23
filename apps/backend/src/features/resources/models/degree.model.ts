import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const degreeModel = pgTable("degree", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDegreeSchema = createInsertSchema(degreeModel);

export type Degree = z.infer<typeof createDegreeSchema>;