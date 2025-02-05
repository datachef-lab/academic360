import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { int } from "drizzle-orm/mysql-core";

export const countryModel = pgTable("countries", {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCountrySchema = createInsertSchema(countryModel);

export type Country = z.infer<typeof createCountrySchema>;