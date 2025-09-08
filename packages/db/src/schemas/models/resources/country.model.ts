import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const countryModel = pgTable("countries", {
    id: serial().primaryKey(),  
    legacyCountryId: integer(),
    name: varchar({ length: 255 }).notNull().unique(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCountrySchema = createInsertSchema(countryModel) as z.ZodTypeAny;

export type Country = z.infer<typeof createCountrySchema>;

export type CountryT = typeof createCountrySchema._type;