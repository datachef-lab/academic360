import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const religionModel = pgTable("religion", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
});

export const createReligionSchema = createInsertSchema(religionModel);

export type Religion = z.infer<typeof createReligionSchema>;