import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const qualificationModel = pgTable("qualifications", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequene: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createQualificationSchema = createInsertSchema(qualificationModel);

export type Qualification = z.infer<typeof createQualificationSchema>;