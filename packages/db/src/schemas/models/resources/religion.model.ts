import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const religionModel = pgTable("religion", {
    id: serial().primaryKey(),
    legacyReligionId: integer(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createReligionSchema = createInsertSchema(religionModel) as z.ZodTypeAny;

export type Religion = z.infer<typeof createReligionSchema>;

export type ReligionT = typeof createReligionSchema._type;