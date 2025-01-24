import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const religionModel = pgTable("religion", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createReligionSchema = createInsertSchema(religionModel);

export type Religion = z.infer<typeof createReligionSchema>;