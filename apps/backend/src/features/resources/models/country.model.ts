import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { int } from "drizzle-orm/mysql-core";

export const countryModel = pgTable("countries", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull(),
    sequence: integer(),
});

export const createCountrySchema = createInsertSchema(countryModel);

export type Country = z.infer<typeof createCountrySchema>;