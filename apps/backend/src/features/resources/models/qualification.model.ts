import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const qualificationModel = pgTable("qualifications", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createQualificationSchema = createInsertSchema(qualificationModel);

export type Qualification = z.infer<typeof createQualificationSchema>;