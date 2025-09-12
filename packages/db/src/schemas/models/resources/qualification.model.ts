import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const qualificationModel = pgTable("qualifications", {
    id: serial().primaryKey(),
    legacyQualificationId: integer(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createQualificationSchema = createInsertSchema(qualificationModel);

export type Qualification = z.infer<typeof createQualificationSchema>;

export type QualificationT = typeof createQualificationSchema._type;