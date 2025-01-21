import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const nationalityModel = pgTable("nationality", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    sequence: integer().unique(),
    code: integer(),
});

export const createNationalitySchema = createInsertSchema(nationalityModel);

export type Nationality = z.infer<typeof createNationalitySchema>;